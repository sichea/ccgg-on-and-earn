import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// 사용자 초대 코드 처리 함수
const handlePendingInvite = async (userId, startParam) => {
  if (!startParam) return;
  
  try {
    console.log(`사용자 ${userId}의 초대 코드 처리 시작: ${startParam}`);
    
    // 모듈 동적 가져오기 
    const { handleInviteParameter } = await import('../features/friends/utils/inviteUtils');
    
    // 초대 파라미터 처리
    const result = await handleInviteParameter(startParam, userId);
    console.log('초대 코드 처리 결과:', result);
    
    // 결과에 관계없이 pendingInviteCode 필드 제거
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { pendingInviteCode: null });
    
    return result;
  } catch (error) {
    console.error('사용자 초대 코드 처리 오류:', error);
    return false;
  }
};

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
          userData.pendingInviteCode = startParam;
          console.log('초대 코드 저장:', startParam);
        }
      }
      
      // 사용자 문서 생성
      await setDoc(userRef, userData);
      
      // 초대 코드가 있으면 별도 함수로 처리 (지연 처리)
      if (userData.pendingInviteCode) {
        // 약간의 지연 후 처리 - Firestore 쓰기 작업이 완료될 시간을 줌
        setTimeout(async () => {
          await handlePendingInvite(userId, userData.pendingInviteCode);
        }, 1000);
      }
      
      // 업데이트된 사용자 문서 반환
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

// 테스트 함수 - 콘솔에서 직접 실행할 수 있음
export const testInvitationBonus = async (inviterId) => {
  try {
    const userRef = doc(db, 'users', inviterId);
    const before = await getDoc(userRef);
    
    if (!before.exists()) {
      console.error('사용자를 찾을 수 없습니다:', inviterId);
      return false;
    }
    
    console.log('테스트 전 상태:', {
      보너스: before.data().invitationBonus || 0,
      포인트: before.data().points || 0,
      초대수: before.data().invitationCount || 0
    });
    
    // 업데이트 시도
    await updateDoc(userRef, {
      invitationBonus: (before.data().invitationBonus || 0) + 1000,
      points: (before.data().points || 0) + 1000,
      invitationCount: (before.data().invitationCount || 0) + 1
    });
    
    // 업데이트 후 확인
    const after = await getDoc(userRef);
    
    console.log('테스트 후 상태:', {
      보너스: after.data().invitationBonus || 0,
      포인트: after.data().points || 0,
      초대수: after.data().invitationCount || 0
    });
    
    return true;
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
    return false;
  }
};