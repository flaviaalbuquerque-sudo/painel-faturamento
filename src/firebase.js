import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCY7YrEnGARBWma4jskPEOyR-qadLDnew",
  authDomain: "painel-faturamento-a2e0c.firebaseapp.com",
  projectId: "painel-faturamento-a2e0c",
  storageBucket: "painel-faturamento-a2e0c.firebasestorage.app",
  messagingSenderId: "204243949389",
  appId: "1:204243949389:web:6eecfc644b2846d4bcc904"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
