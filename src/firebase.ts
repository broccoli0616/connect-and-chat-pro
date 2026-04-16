import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDn0NWcdQ3DbYlc3W803oCJ5-Pefc-q1Qs",
  authDomain: "commpractice-a20fa.firebaseapp.com",
  projectId: "commpractice-a20fa",
  storageBucket: "commpractice-a20fa.firebasestorage.app",
  messagingSenderId: "596008931732",
  appId: "1:596008931732:web:0dd680ef1b9565c09c3f81",
  measurementId: "G-CFLKCMM2EG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);