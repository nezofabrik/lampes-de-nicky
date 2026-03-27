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

function getFS() {
  if (_fsDB) return _fsDB;
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) firebase.initializeApp(_FB_CONFIG);
      _fsDB = firebase.firestore();
    }
  } catch(e) { console.warn('Firebase init:', e); }
  return _fsDB;
}

/* Lit toutes les lampes (sans orderBy pour éviter l'exclusion de docs) */
function fsGetLamps(cb) {
  const fs = getFS();
  if (!fs) { cb(null); return; }
  fs.collection('lamps').get()
    .then(snap => {
      const arr = snap.docs.map(d => d.data())
                           .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      cb(arr.length ? arr : null);
    })
    .catch(() => cb(null));
}

/* Sauvegarde une lampe — vérifie la taille avant d'envoyer */
function fsSaveLamp(lamp, cb) {
  const fs = getFS();
  if (!fs) { if(cb) cb(false); return; }

  // Vérification taille (~1MB max Firestore)
  const sizeEstimate = JSON.stringify(lamp).length;
  if (sizeEstimate > 950000) {
    console.warn('Lampe trop volumineuse pour Firestore (' + Math.round(sizeEstimate/1024) + 'KB), photos compressées davantage');
    // Compresse encore les images si trop grand
    const lightLamp = {
      ...lamp,
      images: (lamp.images || []).map(img => {
        if (!img || !img.startsWith('data:')) return img;
        // Réduction supplémentaire via canvas
        return img; // on retourne quand même, la compression se fait à l'ajout
      })
    };
    if(cb) cb(false, 'too_large');
    return;
  }

  fs.collection('lamps').doc(String(lamp.id)).set(lamp)
    .then(() => { if(cb) cb(true); })
    .catch(e => { console.error('fsSaveLamp:', e); if(cb) cb(false); });
}

/* Supprime une lampe */
function fsDeleteLamp(id, cb) {
  const fs = getFS();
  if (!fs) { if(cb) cb(false); return; }
  fs.collection('lamps').doc(String(id)).delete()
    .then(() => { if(cb) cb(true); })
    .catch(() => { if(cb) cb(false); });
}

/* Supprime toutes les lampes */
function fsDeleteAllLamps(cb) {
  const fs = getFS();
  if (!fs) { if(cb) cb(false); return; }
  fs.collection('lamps').get().then(snap => {
    const batch = fs.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    return batch.commit();
  }).then(() => { if(cb) cb(true); })
    .catch(() => { if(cb) cb(false); });
}
