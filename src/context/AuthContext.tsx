// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

// 定義使用者型別 (對應 Swift 的 PhocialUser)
export interface PhocialUser {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Timestamp;
}

interface AuthContextType {
  user: PhocialUser | null;
  loading: boolean;
  signInWithDevBypass: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PhocialUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 監聽 Firebase 登入狀態 (對應 iOS addStateDidChangeListener)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 從 Firestore 獲取使用者資料
        const userRef = doc(db, 'Users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUser(userSnap.data() as PhocialUser);
        } else {
           // 例外處理：如果資料庫沒有紀錄，建立預設
           setUser({
             uid: firebaseUser.uid,
             displayName: firebaseUser.displayName || '攝影師',
             createdAt: Timestamp.now()
           });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. 確保 Firestore 有使用者文件 (對應 iOS fetchOrCreateUser)
  const fetchOrCreateUser = async (firebaseUser: User, displayName: string) => {
    const userRef = doc(db, 'Users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const newUser: PhocialUser = {
        uid: firebaseUser.uid,
        displayName: displayName,
        createdAt: Timestamp.now()
      };
      await setDoc(userRef, newUser);
      setUser(newUser);
    }
  };

  // 3. 完美復現 iOS 的 開發者模擬登入 (Dev Bypass)
  const signInWithDevBypass = async (nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) throw new Error("請輸入暱稱");
    
    const devEmail = `dev_${trimmed.toLowerCase().replace(/\s+/g, '_')}@phocial.dev`;
    const devPassword = "phocial_dev_2024"; // 跟你 iOS 寫的一模一樣

    try {
      // 嘗試登入
      const userCredential = await signInWithEmailAndPassword(auth, devEmail, devPassword);
      await fetchOrCreateUser(userCredential.user, trimmed);
    } catch (error: any) {
      // 如果找不到帳號，自動註冊一個
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        const userCredential = await createUserWithEmailAndPassword(auth, devEmail, devPassword);
        await updateProfile(userCredential.user, { displayName: trimmed });
        await fetchOrCreateUser(userCredential.user, trimmed);
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithDevBypass, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
