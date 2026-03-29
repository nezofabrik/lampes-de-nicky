/* ============================================
   Firebase — Les Lampes de Nicky
============================================ */
const _FB_CONFIG = {
  apiKey:            "AIzaSyC8xQ9W9KSs-xdG1LOJVxBmPKELFcI8ZME",
  authDomain:        "lampes-de-nicky.firebaseapp.com",
  projectId:         "lampes-de-nicky",
  storageBucket:     "lampes-de-nicky.firebasestorage.app",
  messagingSenderId: "1094309121111",
  appId:             "1:1094309121111:web:2456cc032a6a8319ed6712"
};

let _fsDB = null;
let _fsPersistDone = false;
let _fsStorage = null;

function _initApp() {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(_FB_CONFIG);
  }
}

/* Auto-init dès que le script est chargé */
_initApp();

function getFS() {
  if (_fsDB) return _fsDB;
  try {
    _initApp();
    if (typeof firebase !== 'undefined') {
      _fsDB = firebase.firestore();
      if (!_fsPersistDone) {
        _fsPersistDone = true;
        _fsDB.enablePersistence({ synchronizeTabs: true }).catch(function() {});
      }
    }
  } catch(e) { console.warn('Firebase init:', e); }
  return _fsDB;
}

function getStorage() {
  if (_fsStorage) return _fsStorage;
  try {
    _initApp();
    if (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
      _fsStorage = firebase.storage();
    }
  } catch(e) { console.warn('Storage init:', e); }
  return _fsStorage;
}

/* ─── Firestore : Lampes ─── */

/* Lit toutes les lampes (sans orderBy pour éviter l'exclusion de docs) */
function fsGetLamps(cb) {
  var fs = getFS();
  if (!fs) { cb(null); return; }
  fs.collection('lamps').get()
    .then(function(snap) {
      var arr = snap.docs.map(function(d) { return d.data(); })
                         .sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
      cb(arr.length ? arr : null);
    })
    .catch(function() { cb(null); });
}

/* Sauvegarde une lampe */
function fsSaveLamp(lamp, cb) {
  var fs = getFS();
  if (!fs) { if(cb) cb(false); return; }

  // Vérification taille (sécurité — ne devrait plus se déclencher avec Storage)
  var sizeEstimate = JSON.stringify(lamp).length;
  if (sizeEstimate > 950000) {
    console.warn('Lampe trop volumineuse pour Firestore (' + Math.round(sizeEstimate/1024) + 'KB)');
    if(cb) cb(false, 'too_large');
    return;
  }

  fs.collection('lamps').doc(String(lamp.id)).set(lamp)
    .then(function() { if(cb) cb(true); })
    .catch(function(e) { console.error('fsSaveLamp:', e); if(cb) cb(false); });
}

/* Supprime une lampe */
function fsDeleteLamp(id, cb) {
  var fs = getFS();
  if (!fs) { if(cb) cb(false); return; }
  fs.collection('lamps').doc(String(id)).delete()
    .then(function() { if(cb) cb(true); })
    .catch(function() { if(cb) cb(false); });
}

/* Supprime toutes les lampes */
function fsDeleteAllLamps(cb) {
  var fs = getFS();
  if (!fs) { if(cb) cb(false); return; }
  fs.collection('lamps').get().then(function(snap) {
    var batch = fs.batch();
    snap.docs.forEach(function(d) { batch.delete(d.ref); });
    return batch.commit();
  }).then(function() { if(cb) cb(true); })
    .catch(function() { if(cb) cb(false); });
}

/* ─── Storage : Images ─── */

/* Convertit un data URL base64 en Blob */
function _dataUrlToBlob(dataUrl) {
  var parts = dataUrl.split(',');
  var mime  = parts[0].match(/:(.*?);/)[1];
  var raw   = atob(parts[1]);
  var arr   = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/* Upload une image vers Firebase Storage
   Chemin : lamps/{lampId}/{timestamp}_{index}.jpg
   Retourne l'URL de téléchargement via cb(url) ou cb(null) en cas d'erreur */
function fsUploadImage(lampId, index, base64DataUrl, cb) {
  var storage = getStorage();
  if (!storage) { if(cb) cb(null); return; }

  var blob     = _dataUrlToBlob(base64DataUrl);
  var fileName = Date.now() + '_' + index + '.jpg';
  var path     = 'lamps/' + lampId + '/' + fileName;
  var ref      = storage.ref().child(path);

  ref.put(blob, { contentType: 'image/jpeg' })
    .then(function() { return ref.getDownloadURL(); })
    .then(function(url) { if(cb) cb(url); })
    .catch(function(e) { console.error('fsUploadImage:', e); if(cb) cb(null); });
}

/* Supprime toutes les images d'une lampe dans Storage */
function fsDeleteLampImages(lampId, cb) {
  var storage = getStorage();
  if (!storage) { if(cb) cb(false); return; }

  var folderRef = storage.ref().child('lamps/' + lampId);
  folderRef.listAll()
    .then(function(result) {
      if (!result.items.length) { if(cb) cb(true); return; }
      var promises = result.items.map(function(item) { return item.delete(); });
      return Promise.all(promises);
    })
    .then(function() { if(cb) cb(true); })
    .catch(function(e) { console.warn('fsDeleteLampImages:', e); if(cb) cb(false); });
}

/* Supprime une seule image par son chemin Storage */
function fsDeleteSingleImage(storagePath, cb) {
  var storage = getStorage();
  if (!storage) { if(cb) cb(false); return; }

  storage.ref().child(storagePath).delete()
    .then(function() { if(cb) cb(true); })
    .catch(function(e) { console.warn('fsDeleteSingleImage:', e); if(cb) cb(false); });
}

/* Extrait le chemin Storage depuis une URL Firebase Storage
   Ex: https://firebasestorage.googleapis.com/v0/b/.../o/lamps%2F5%2Ffile.jpg?...
   Retourne null si ce n'est pas une URL Storage */
function fsStoragePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  var match = url.match(/\/o\/([^?]+)/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch(e) { return null; }
}

/* Vérifie si une string est du base64 (pas une URL) */
function isBase64Image(str) {
  return typeof str === 'string' && str.indexOf('data:') === 0;
}

/* Upload toutes les images base64 d'un tableau, remplace par des URLs
   Les images déjà URL sont gardées telles quelles
   cb(updatedArray) */
function fsUploadAllImages(lampId, images, cb) {
  if (!images || !images.length) { if(cb) cb([]); return; }
  if (typeof fsUploadImage !== 'function' || !getStorage()) { if(cb) cb(images); return; }

  var toUpload = [];
  images.forEach(function(src, i) {
    if (isBase64Image(src)) toUpload.push(i);
  });

  if (!toUpload.length) { if(cb) cb(images); return; }

  var result = images.slice();
  var done = 0;
  toUpload.forEach(function(idx) {
    fsUploadImage(lampId, idx, result[idx], function(url) {
      if (url) {
        result[idx] = url;
      }
      // Si upload échoue, on garde le base64 en fallback
      done++;
      if (done === toUpload.length) {
        if(cb) cb(result);
      }
    });
  });
}
