/* ============================================
   Firebase — Les Lampes de Nicky
   Config publique (sécurité via Firestore Rules)
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

/* Lit toutes les lampes depuis Firestore (triées par id) */
function fsGetLamps(cb) {
  const fs = getFS();
  if (!fs) { cb(null); return; }
  fs.collection('lamps').orderBy('sortOrder').get()
    .then(snap => {
      const arr = snap.docs.map(d => d.data());
      cb(arr.length ? arr : null);
    })
    .catch(() => cb(null));
}

/* Sauvegarde une lampe dans Firestore */
function fsSaveLamp(lamp, cb) {
  const fs = getFS();
  if (!fs) { if(cb) cb(false); return; }
  const id = String(lamp.id);
  fs.collection('lamps').doc(id).set({ ...lamp, id: lamp.id })
    .then(() => { if(cb) cb(true); })
    .catch(e => { console.error('fsSaveLamp:', e); if(cb) cb(false); });
}

/* Supprime une lampe de Firestore */
function fsDeleteLamp(id, cb) {
  const fs = getFS();
  if (!fs) { if(cb) cb(false); return; }
  fs.collection('lamps').doc(String(id)).delete()
    .then(() => { if(cb) cb(true); })
    .catch(e => { console.error('fsDeleteLamp:', e); if(cb) cb(false); });
}

/* Supprime toutes les lampes (reset catalogue) */
function fsDeleteAllLamps(cb) {
  const fs = getFS();
  if (!fs) { if(cb) cb(false); return; }
  fs.collection('lamps').get().then(snap => {
    const batch = fs.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    return batch.commit();
  }).then(() => { if(cb) cb(true); })
    .catch(e => { console.error('fsDeleteAll:', e); if(cb) cb(false); });
}
