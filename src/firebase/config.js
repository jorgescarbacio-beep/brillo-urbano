import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDvITFllSYOsJrUBdNefTaZn5JLBG9P5_Q",
    authDomain: "brillo-urbano.firebaseapp.com",
    projectId: "brillo-urbano",
    storageBucket: "brillo-urbano.firebasestorage.app",
    messagingSenderId: "880678883681",
    appId: "1:880678883681:web:a3b33bbd91731344fd3520"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);