
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9xI4eXAqMaKfeX9G9D11Jexi_WULtPx8",
  authDomain: "v2gisqocontent.firebaseapp.com",
  databaseURL: "https://v2gisqocontent-default-rtdb.firebaseio.com",
  projectId: "v2gisqocontent",
  storageBucket: "v2gisqocontent.firebasestorage.app",
  messagingSenderId: "326232124070",
  appId: "1:326232124070:web:1a7a18b270b52da7432267"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);
export const db = getFirestore(app);
