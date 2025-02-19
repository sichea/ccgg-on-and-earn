// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDcl9hVJNKeC1BRzieT7r3BF5YyMK7hvb0",
  authDomain: "ccgg-on-and-earn-cee78.firebaseapp.com",
  projectId: "ccgg-on-and-earn-cee78",
  storageBucket: "ccgg-on-and-earn-cee78.firebasestorage.app",
  messagingSenderId: "296882338228",
  appId: "1:296882338228:web:f98fb5b4fdb715d7021ae1",
  measurementId: "G-JD989S7Y57"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);