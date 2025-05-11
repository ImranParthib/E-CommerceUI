import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAMGBV5_swSPh5_2KUaaoePXrvjAT8B-4o",
    authDomain: "e-commerce-91626.firebaseapp.com",
    projectId: "e-commerce-91626",
    storageBucket: "e-commerce-91626.firebasestorage.app",
    messagingSenderId: "886431866079",
    appId: "1:886431866079:web:765e729215592f2c301d6a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };