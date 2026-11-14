/* ねこコード：ログインと同期（Firebase Authentication ＋ Firestore） */
const cfg = window.NEKO_FIREBASE;
function ready(api){ window.NekoCloud = api; window.dispatchEvent(new Event('nekocloud')); }
if (!cfg || !cfg.apiKey) {
  ready({ enabled: false, reason: 'config' });
} else {
  try {
    const V = '10.12.2';
    const [{ initializeApp }, A, F] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    const app = initializeApp(cfg);
    const auth = A.getAuth(app); auth.languageCode = 'ja';
    const db = F.getFirestore(app);
    ready({
      enabled: true,
      user: null,
      onUser(cb){ A.onAuthStateChanged(auth, (u) => { this.user = u; cb(u); }); },
      signIn: (email, pw) => A.signInWithEmailAndPassword(auth, email, pw),
      signUp: (email, pw) => A.createUserWithEmailAndPassword(auth, email, pw),
      signOut: () => A.signOut(auth),
      reset: (email) => A.sendPasswordResetEmail(auth, email),
      async load(uid){ const s = await F.getDoc(F.doc(db, 'users', uid)); return s.exists() ? s.data() : null; },
      save(uid, data){ return F.setDoc(F.doc(db, 'users', uid), data); },
      // ほかの端末が保存したら、すぐ知らせる
      watch(uid, cb){ return F.onSnapshot(F.doc(db, 'users', uid), (s) => { if (s.exists() && !s.metadata.hasPendingWrites) cb(s.data()); }, () => {}); }
    });
  } catch (e) {
    ready({ enabled: false, reason: 'offline' });
  }
}
