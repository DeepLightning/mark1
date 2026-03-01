import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Firebase 설정
// TODO: Firebase Console에서 프로젝트를 생성하고 아래 값들을 업데이트하세요
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'default'}.firebaseio.com`
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 (리더보드용)
export const db = getFirestore(app);

// Realtime Database (멀티플레이어 게임용)
export const realtimeDb = getDatabase(app);
