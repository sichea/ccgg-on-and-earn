import { db } from '../../../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, getDocs } from 'firebase/firestore';

// 초대 코드 생성 함수
export const generateInviteCode = (userId) => {
  // 사용자 ID와 타임스탬프를 조합하여 코드 생성
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${userId.substring(0, 6)}_${timestamp}_${randomStr}`;
};

// 초대 링크 생성 함수
export const generateInviteLink = (userId) => {
  const inviteCode = generateInviteCode(userId);
  const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'CCGGMingBot';
  return `https://t.me/${botName}?start=invite_${inviteCode}`;
};

// 초대 완료 처리 함수
export const processInvitation = async (inviterUserId, inviteeUserId) => {
  try {
    console.log(`처리 중: 초대자 ${inviterUserId}, 초대된 사용자 ${inviteeUserId}`);
    
    // 이미 처리된 초대인지 확인
    const inviteeDocRef = doc(db, 'users', inviteeUserId);
    const inviteeDoc = await getDoc(inviteeDocRef);
    
    if (inviteeDoc.exists() && inviteeDoc.data().invitedBy) {
      console.log('이미 초대된 사용자입니다.');
      return false;
    }
    
    // 초대자가 자기 자신인지 확인
    if (inviterUserId === inviteeUserId) {
      console.log('자기 자신을 초대할 수 없습니다.');
      return false;
    }
    
    // 초대자 문서 존재 확인
    const inviterDocRef = doc(db, 'users', inviterUserId);
    const inviterDocSnap = await getDoc(inviterDocRef);
    
    if (!inviterDocSnap.exists()) {
      console.log('초대자를 찾을 수 없습니다.');
      return false;
    }
    
    // 초대된 사용자 문서 업데이트 (invitedBy 필드 추가)
    await updateDoc(inviteeDocRef, {
      invitedBy: inviterUserId,
      invitedAt: new Date()
    });
    
    // 초대자 정보 업데이트
    await updateDoc(inviterDocRef, {
      // 초대 보너스 증가
      invitationBonus: increment(1000), // 1000 MOPI 보상
      
      // 초대된 친구 목록에 추가
      friends: arrayUnion({
        userId: inviteeUserId,
        joinedAt: new Date(),
        status: 'active'
      }),
      
      // 초대 카운트 증가
      invitationCount: increment(1)
    });
    
    console.log('초대 처리 완료!');
    return true;
  } catch (error) {
    console.error('Error processing invitation:', error);
    return false;
  }
};

// 초대 코드 검증 및 초대자 ID 추출 함수
export const validateInviteCode = (startParam) => {
  try {
    // 'invite_' 접두사 제거
    let inviteCode = startParam;
    if (startParam.startsWith('invite_')) {
      inviteCode = startParam.substring(7);
    }
    
    // 코드 형식 검증 (userId_timestamp_randomStr)
    const parts = inviteCode.split('_');
    if (parts.length !== 3) {
      console.log('유효하지 않은 초대 코드 형식:', inviteCode);
      return null;
    }
    
    // 초대자 ID 접두사 추출 (실제 전체 ID를 알기 위해서는 데이터베이스 검색 필요)
    const inviterIdPrefix = parts[0];
    return inviterIdPrefix;
  } catch (error) {
    console.error('초대 코드 검증 오류:', error);
    return null;
  }
};

// 초대자 ID 조회 함수 (ID 접두사로 전체 ID 찾기)
export const findInviterByIdPrefix = async (idPrefix) => {
  try {
    // 모든 사용자 조회 (실제 구현에서는 쿼리 최적화 필요)
    const usersCollectionRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    
    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      if (userId.startsWith(idPrefix)) {
        return userId;
      }
    }
    
    console.log('해당 접두사와 일치하는 사용자를 찾을 수 없습니다:', idPrefix);
    return null;
  } catch (error) {
    console.error('초대자 ID 조회 오류:', error);
    return null;
  }
};

// 초대 파라미터 처리 함수 (텔레그램 봇 start 파라미터)
export const handleInviteParameter = async (startParam, inviteeUserId) => {
  try {
    if (!startParam || !inviteeUserId) return false;
    
    // 접두사가 'invite_'인지 확인
    if (!startParam.startsWith('invite_')) {
      console.log('초대 파라미터가 아닙니다:', startParam);
      return false;
    }
    
    // 초대 코드 검증 및 초대자 ID 접두사 추출
    const inviterIdPrefix = validateInviteCode(startParam);
    if (!inviterIdPrefix) return false;
    
    // 초대자 ID 조회
    const inviterId = await findInviterByIdPrefix(inviterIdPrefix);
    if (!inviterId) return false;
    
    // 초대 처리
    return await processInvitation(inviterId, inviteeUserId);
  } catch (error) {
    console.error('초대 파라미터 처리 오류:', error);
    return false;
  }
};

// 사용자 초대 통계 조회 함수
export const getInvitationStats = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        totalInvited: userData.invitationCount || 0,
        totalBonus: userData.invitationBonus || 0,
        friends: userData.friends || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting invitation stats:', error);
    return null;
  }
};