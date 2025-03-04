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
      
      if (startParam) {
        // 초대 코드 형식과 일치하는지 확인 (userId_timestamp_randomStr)
        if (startParam.split('_').length === 3) {
          // 초대 코드 처리는 사용자 생성 후 별도 함수에서 처리
          userData.pendingInviteCode = startParam;
          console.log('초대 코드 저장:', startParam);
        }
      }
      
      await setDoc(userRef, userData);
      
      // 초대 코드 처리 (있는 경우)
      if (userData.pendingInviteCode) {
        try {
          console.log('초대 코드 처리 시작:', userData.pendingInviteCode);
          // inviteUtils에서 처리 함수 import
          const { handleInviteParameter } = await import('../features/friends/utils/inviteUtils');
          const result = await handleInviteParameter(userData.pendingInviteCode, userId);
          console.log('초대 코드 처리 결과:', result);
          
          // 처리 후 pendingInviteCode 필드 제거
          await updateDoc(userRef, {
            pendingInviteCode: null
          });
        } catch (inviteError) {
          console.error('초대 코드 처리 오류:', inviteError);
        }
      }
      
      return { ...userData, id: userId };
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