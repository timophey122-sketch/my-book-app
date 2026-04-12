// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAtGF-kzHNPMZsZ_eTaO6e9sYbqRLsaVG8",
  authDomain: "book-app-2acf8.firebaseapp.com",
  projectId: "book-app-2acf8",
  storageBucket: "book-app-2acf8.firebasestorage.app",
  messagingSenderId: "445075938815",
  appId: "1:445075938815:web:190f60f5e7d806949d1bca",
  measurementId: "G-JEWE1T76P6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
