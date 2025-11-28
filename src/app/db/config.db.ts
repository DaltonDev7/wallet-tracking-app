// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDHwhhmK3plP84v7ST_7JAqSDCA-OgR1HI",
//   authDomain: "wallet-tracking-app-51212.firebaseapp.com",
//   projectId: "wallet-tracking-app-51212",
//   storageBucket: "wallet-tracking-app-51212.firebasestorage.app",
//   messagingSenderId: "76181847288",
//   appId: "1:76181847288:web:303e45c6d8c47108eb0f0d"
// };

const firebaseConfig = {
  apiKey: "AIzaSyC0mMTa0IF0Jw-kzi3u83BOklNmTJgAllY",
  authDomain: "wallet-tracking-app-dev.firebaseapp.com",
  projectId: "wallet-tracking-app-dev",
  storageBucket: "wallet-tracking-app-dev.firebasestorage.app",
  messagingSenderId: "773843993196",
  appId: "1:773843993196:web:527702de3b155b9514ce49",
  measurementId: "G-F9EJ4WDB3Q"
};

// Initialize Firebase
export const appConfigFirebase = initializeApp(firebaseConfig);