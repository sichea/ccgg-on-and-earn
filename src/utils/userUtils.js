import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { validateInviteCode, processInvitation } from '../features/friends/utils/inviteUtils';

// 사용자 초대 코드 처리 함수
const handlePendingInvite = async (userId, startParam) => {
  if (!startParam) return;
  
  try {
    console.log(`사용자 ${userId}의 초대 코드 처리 시작: ${startParam}`);
    
    // 초대 코드에서 초대자 ID 추출
    const inviterId = validateInviteCode(startParam);
    
    if (inviterId) {
      // 초대 처리
      const result = await processInvitation(inviterId, userId);
      console.log('초대 코드 처리 결과:', result);
      
      // pendingInviteCode 필드 제거
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { pendingInviteCode: null });
      
      return result;
    } else {
      console.log('유효하지 않은 초대 코드');
      return { success: false, message: '유효하지 않은 초대 코드입니다.' };
    }
  } catch (error) {
    console.error('사용자 초대 코드 처리 오류:', error);
    return { success: false, message: `초대 코드 처리 중 오류 발생: ${error.message}` };
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
      console.log('사용자 문서가 없어 새로 생성합니다.', userId);
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
        // 초대 코드 검증
        const inviterId = validateInviteCode(startParam);
        if (inviterId) {
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
    
    // 기존 사용자 문서에 pendingInviteCode가 있는지 확인하고 처리
    const userData = userDoc.data();
    if (userData.pendingInviteCode) {
      console.log('처리되지 않은 초대 코드 발견:', userData.pendingInviteCode);
      setTimeout(async () => {
        await handlePendingInvite(userId, userData.pendingInviteCode);
      }, 1000);
    }
    
    // start 파라미터가 있고, 아직 초대되지 않은 사용자라면 직접 처리
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (startParam && !userData.invitedBy) {
      console.log('실시간 초대 파라미터 발견:', startParam);
      
      // 초대 코드 검증
      const inviterId = validateInviteCode(startParam);
      if (inviterId) {
        console.log('직접 초대 처리 시작:', inviterId);
        await processInvitation(inviterId, userId);
        
        // 업데이트된 사용자 정보 반환
        const updatedUserDoc = await getDoc(userRef);
        return { ...updatedUserDoc.data(), id: userId };
      }
    }
    
    return { ...userData, id: userId };
  } catch (error) {
    console.error('사용자 문서 조회/생성 오류:', error);
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
      // 기존 문서 업데이트
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date()
      });
    } else {
      // 문서가 없는 경우 새로 생성
      await setDoc(userRef, { 
        ...data, 
        createdAt: new Date(),
        updatedAt: new Date(),
        // 친구 초대 관련 필드도 기본값으로 초기화
        invitationBonus: data.invitationBonus || 0,
        invitationCount: data.invitationCount || 0,
        friends: data.friends || []
      });
    }
    
    // 업데이트된 문서 조회하여 반환
    const updatedDoc = await getDoc(userRef);
    return { ...updatedDoc.data(), id: userId };
  } catch (error) {
    console.error('사용자 문서 업데이트 오류:', error);
    return null;
  }
};