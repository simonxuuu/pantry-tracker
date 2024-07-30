// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import {getFirestore} from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADNM9PxCkp8SH3pp69Dj6efk0-6y6hqNs",
  authDomain: "headstarterpantryapp-f5bf2.firebaseapp.com",
  projectId: "headstarterpantryapp-f5bf2",
  storageBucket: "headstarterpantryapp-f5bf2.appspot.com",
  messagingSenderId: "382170535885",
  appId: "1:382170535885:web:911d1bb558bfd4f8171684"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app)
export {app, firestore};