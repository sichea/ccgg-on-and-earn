import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// 사용자 문서 가져오기 (없으면 생성)
export const getUserDocument = async (telegramUser) => {
  if (!telegramUser?.id) return null;
  
  const userId = telegramUser.id.toString();
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // 기본 사용자 문서 생성
      const userData = {
        points: 0,
        lastClaimTime: null,
        createdAt: new Date(),
        telegramId: userId,
        username: telegramUser?.username || null,
        firstName: telegramUser?.first_name || null,
        lastName: telegramUser?.last_name || null,
        // 친구 초대 관련 필드 추가
        invitationBonus: 0,
        invitationCount: 0,
        friends: []
      };
      
      // start 파라미터에서 초대 코드 확인 (텔레그램 WebApp startParam)
      const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      console.log('초대 파라미터 확인:', startParam);
      
      // 먼저 사용자 문서 생성
      await setDoc(userRef, userData);
      
      // 초대 코드가 있으면 처리
      if (startParam && startParam.split('_').length === 3) {
        try {
          console.log('초대 코드 처리 시작:', startParam);
          // 직접 inviteUtils에서 함수 import하는 대신 경로 변경
          const { handleInviteParameter } = await import('../features/friends/utils/inviteUtils');
          
          // 초대 코드 처리 전에 짧은 지연을 추가
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const result = await handleInviteParameter(startParam, userId);
          console.log('초대 코드 처리 결과:', result);
          
          // pendingInviteCode 필드 제거
          await updateDoc(userRef, {
            pendingInviteCode: null
          });
        } catch (inviteError) {
          console.error('초대 코드 처리 오류:', inviteError);
        }
      }
      
      const freshUserDoc = await getDoc(userRef);
      return { ...freshUserDoc.data(), id: userId };
    }
    
    return { ...userDoc.data(), id: userId };
  } catch (error) {
    console.error('Error fetching/creating user document:', error);
    return null;
  }
};

// 사용자 문서 업데이트
export const updateUserDocument = async (userId, data) => {
  if (!userId) return null;
  
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, data);
    } else {
      await setDoc(userRef, { 
        ...data, 
        createdAt: new Date(),
        // 친구 초대 관련 필드도 기본값으로 초기화
        invitationBonus: 0,
        invitationCount: 0,
        friends: []
      });
    }
    
    const updatedDoc = await getDoc(userRef);
    return { ...updatedDoc.data(), id: userId };
  } catch (error) {
    console.error('Error updating user document:', error);
    return null;
  }
};