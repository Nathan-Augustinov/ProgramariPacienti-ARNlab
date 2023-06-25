// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
// import { encode as btoa, decode as atob } from 'base-64';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// if (!global.btoa) {
//   global.btoa = btoa;
// }

// if (!global.atob) {
//   global.atob = atob;
// }

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnYUaNaUD16XaYV_qgYV9Yowoe69DJZr4",
  authDomain: "programaripacienti-arnlab.firebaseapp.com",
  projectId: "programaripacienti-arnlab",
  storageBucket: "programaripacienti-arnlab.appspot.com",
  messagingSenderId: "495656863930",
  appId: "1:495656863930:web:2e24da9b11940c54dc1a83",
  measurementId: "G-ECVZ8NSZRM",
  databaseURL: "https://programaripacienti-arnlab-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const firestore = getFirestore(app);


export {database, auth, storage, firestore}

