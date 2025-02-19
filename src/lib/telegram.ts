'use client';

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// 클라이언트 사이드에서만 사용할 수 있도록 수정
export const initTelegramWebApp = () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const webapp = window.Telegram?.WebApp;
    if (webapp) {
      webapp.ready();
      webapp.expand();
    }
    return webapp;
  }
  return null;
};

// 텔레그램 유저 데이터 저장
export const saveTelegramUser = async (telegramUser: any) => {
  try {
    const userRef = doc(db, 'users', telegramUser.id.toString());
    await setDoc(userRef, {
      id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      points: 0,
      coins: 0,
      lastClaimTime: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

// 유저 포인트 업데이트
export const updateUserPoints = async (userId: string, points: number, coins: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      await setDoc(userRef, {
        points: (userData.points || 0) + points,
        coins: (userData.coins || 0) + coins,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating points:', error);
    return false;
  }
};