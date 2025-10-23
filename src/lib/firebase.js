// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  // If popups get blocked, switch to redirect:
  // signInWithRedirect,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

/** Firebase config comes from Vite env vars */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);

/** Auth + Firestore singletons */
export const auth = getAuth(app);
export const db = getFirestore(app);

/** Google provider */
const provider = new GoogleAuthProvider();

/** Called by the Sign In button in App.jsx */
export async function googleLogin() {
  // If popup blockers cause issues, use the redirect version:
  // return signInWithRedirect(auth, provider);
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

/** Called by the Sign Out button in App.jsx */
export async function logout() {
  await signOut(auth);
}

/** (Optional) simple hello test we used earlier */
export async function writeHello(uid) {
  const ref = doc(db, "test", uid);
  await setDoc(ref, { hello: "world", ts: Date.now() });
}
export async function readHello(uid) {
  const ref = doc(db, "test", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
