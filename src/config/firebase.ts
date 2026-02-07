// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "abc",
  authDomain: "abc",
  projectId: "abc",
  storageBucket: "abc",
  messagingSenderId: "abc",
  appId: "abc",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use throughout the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);