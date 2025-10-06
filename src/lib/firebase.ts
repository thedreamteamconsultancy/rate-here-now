import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyADXZSwzlsJTBQ0u7aOdEF9sizRymt0X7s",
  authDomain: "ratehere-4a797.firebaseapp.com",
  projectId: "ratehere-4a797",
  storageBucket: "ratehere-4a797.firebasestorage.app",
  messagingSenderId: "892197834271",
  appId: "1:892197834271:web:e238d960fe691f46228f2a",
  measurementId: "G-Z17LC5FNJW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
