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
 const webapp = typeof window !== 'undefined' 
   ? window.Telegram?.WebApp 
   : undefined;

 try {
   if (webapp) {
     // 디버그 정보 저장
     localStorage.setItem('webappDebug', JSON.stringify({
       timestamp: new Date().toISOString(),
       hasWebApp: true,
       userInfo: webapp.initDataUnsafe?.user ? {
         id: webapp.initDataUnsafe.user.id,
         username: webapp.initDataUnsafe.user.username
       } : null
     }));

     webapp.ready();
     webapp.expand();
     return webapp;
   }

   // WebApp이 없는 경우
   localStorage.setItem('webappDebug', JSON.stringify({
     timestamp: new Date().toISOString(),
     hasWebApp: false,
     error: 'WebApp not available'
   }));

   return null;
 } catch (error) {
   console.error('Telegram WebApp initialization error:', error);
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