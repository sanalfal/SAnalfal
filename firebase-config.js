/* =========================================================
   Firebase ayarları — senin proje bilgilerinle dolduruldu.
   (Firebase web anahtarları istemci tarafında görünür, bu normaldir;
    güvenliği Firestore kuralları sağlar.)
   ========================================================= */
window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAW35gt4H72KNfIivOgB_M5WAw71Yl5zaI",
  authDomain:        "sanalfal-fcb3a.firebaseapp.com",
  projectId:         "sanalfal-fcb3a",
  storageBucket:     "sanalfal-fcb3a.firebasestorage.app",
  messagingSenderId: "183706005595",
  appId:             "1:183706005595:web:e24acb5d7eb5d71f20cf7e",
  measurementId:     "G-NSL0W1PXEK"
};

/* Yapılandırılmış mı? */
window.fbConfigured = function(){
  var c = window.FIREBASE_CONFIG || {};
  return c.apiKey && String(c.apiKey).indexOf("BURAYA") === -1
      && c.projectId && String(c.projectId).indexOf("BURAYA") === -1;
};

/* Firestore örneğini başlat (uygulama başına bir kere) */
window.initFalFirebase = function(){
  if(window._falDb) return window._falDb;
  if(!(window.fbConfigured && window.fbConfigured()) || !window.firebase) return null;
  try{
    firebase.initializeApp(window.FIREBASE_CONFIG);
    window._falDb = firebase.firestore();
    return window._falDb;
  }catch(e){ console.warn("Firebase başlatılamadı:", e); return null; }
};
