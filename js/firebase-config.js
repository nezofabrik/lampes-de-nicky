/* ============================================
   Firebase — Les Lampes de Nicky (Firestore only)
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
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      _fsDB = firebase.firestore();
    }
  } catch(e) { console.warn('Firebase init:', e); }
  return _fsDB;
}

/* ─── Firestore : Lampes ─── */

/* Lit toutes les lampes avec timeout de sécurité */
function fsGetLamps(cb) {
  var fs = getFS();
  if (!fs) { cb(null); return; }
  var done = false;
  /* Timeout : si Firestore ne répond pas en 6s, fallback local */
  var timer = setTimeout(function() {
    if (!done) { done = true; console.warn('fsGetLamps timeout'); cb(null); }
  }, 6000);
  fs.collection('lamps').get()
    .then(function(snap) {
      if (done) return;
      done = true; clearTimeout(timer);
      var arr = snap.docs.map(function(d) { return d.data(); })
                         .sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
      cb(arr.length ? arr : null);
    })
    .catch(function(e) {
      if (done) return;
      done = true; clearTimeout(timer);
      console.warn('fsGetLamps error:', e);
      cb(null);
    });
}

/* Sauvegarde une lampe */
function fsSaveLamp(lamp, cb) {
  var fs = getFS();
  if (!fs) { if(cb) cb(false, 'no_firebase'); return; }

  /* Vérification taille — limite Firestore 1MB */
  var sizeEstimate = JSON.stringify(lamp).length;
  if (sizeEstimate > 900000) {
    console.warn('Lampe trop volumineuse pour Firestore (' + Math.round(sizeEstimate/1024) + 'KB)');
    if(cb) cb(false, 'too_large');
    return;
  }

  fs.collection('lamps').doc(String(lamp.id)).set(lamp)
    .then(function() { if(cb) cb(true); })
    .catch(function(e) {
      console.error('fsSaveLamp:', e.code, e.message);
      var reason = e.code === 'permission-denied' ? 'not_auth' : (e.message || 'erreur');
      if(cb) cb(false, reason);
    });
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

/* Stub pour compatibilité (Storage non disponible sur plan Spark) */
function isBase64Image(str) {
  return typeof str === 'string' && str.indexOf('data:') === 0;
}
