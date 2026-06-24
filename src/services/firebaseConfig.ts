// src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3Hmgwu1SviPTKVI2U_4fANR1xNYDgdy4",
  authDomain: "phocial-94327.firebaseapp.com",
  projectId: "phocial-94327",
  storageBucket: "phocial-94327.firebasestorage.app",
  messagingSenderId: "240739660051",
  appId: "1:240739660051:web:d125740510e532896e6ae6",
  measurementId: "G-4XP29PLCZK"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出 auth 與 db 供其他檔案使用
export const auth = getAuth(app);
export const db = getFirestore(app);
