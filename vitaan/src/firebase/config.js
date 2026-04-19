import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAoyJdEIyhjQ3jbaCxsADFadfqmBWZk5wo",
  authDomain: "allocraftai.firebaseapp.com",
  projectId: "allocraftai",
  storageBucket: "allocraftai.firebasestorage.app",
  messagingSenderId: "744497380679",
  appId: "1:744497380679:web:bbaf7f139926e9a8ede062",
  measurementId: "G-XTE0HYN3K3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to functions emulator if running locally
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
