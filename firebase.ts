import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDC1EYzJ87v23UuillpAqSETenCoJVYhOA",
  authDomain: "egongegong-eoeo.firebaseapp.com",
  projectId: "egongegong-eoeo",
  storageBucket: "egongegong-eoeo.firebasestorage.app",
  messagingSenderId: "1002249339676",
  appId: "1:1002249339676:web:8fef7503c9f23f5a4eb0d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);