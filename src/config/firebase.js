import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpE3wvQCDskikxbr7Fqb9Gt8fpOAI0Jdo",
  authDomain: "budgetapp-2f553.firebaseapp.com",
  projectId: "budgetapp-2f553",
  storageBucket: "budgetapp-2f553.firebasestorage.app",
  messagingSenderId: "902072927164",
  appId: "1:902072927164:web:fa4adeff4286cd6a84e1b9",
  measurementId: "G-7JD85ZB6CN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
