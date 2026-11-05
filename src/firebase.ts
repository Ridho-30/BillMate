
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA8NQAI31Vrt0VPt8En5sD51YM-V0BvvQQ",
  authDomain: "billmate-d22c2.firebaseapp.com",
  projectId: "billmate-d22c2",
  storageBucket: "billmate-d22c2.firebasestorage.app",
  messagingSenderId: "462936021158",
  appId: "1:462936021158:web:9a063542b353ed3a133c67",
  measurementId: "G-7RFKGT4FDK"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
