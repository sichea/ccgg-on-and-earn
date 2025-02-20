// src/lib/telegram.ts
'use client';

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        MainButton: {
          text: string;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: () => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: () => void;
        };
        initDataUnsafe?: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
      };
    };
  }
}

export const initTelegramWebApp = () => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      
      // 디버깅 정보를 localStorage에 저장
      localStorage.setItem('webappDebug', JSON.stringify({
        hasWebApp: true,
        hasUser: !!webapp.initDataUnsafe?.user,
        userId: webapp.initDataUnsafe?.user?.id,
        timestamp: new Date().toISOString()
      }));

      webapp.ready();
      webapp.expand();
      return webapp;
    }

    // WebApp이 없는 경우도 기록
    localStorage.setItem('webappDebug', JSON.stringify({
      hasWebApp: false,
      error: 'WebApp not found',
      timestamp: new Date().toISOString()
    }));

    return null;
  } catch (error) {
    // 에러 발생 시 기록
    localStorage.setItem('webappDebug', JSON.stringify({
      hasWebApp: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }));

    return null;
  }
};

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export const saveTelegramUser = async (telegramUser: TelegramUser) => {
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