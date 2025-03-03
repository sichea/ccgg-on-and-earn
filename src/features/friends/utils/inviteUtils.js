import { db } from '../../../services/firebase';
import { getUserDocument, updateUserDocument } from '../../../utils/userUtils';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

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
  return `https://t.me/your_bot_name?start=${inviteCode}`;
};

// 초대 완료 처리 함수
export const processInvitation = async (inviterUserId, inviteeUserId) => {
  try {
    // 초대한 사용자의 문서 참조
    const inviterDocRef = doc(db, 'users', inviterUserId);
    
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
    
    // 사용자 데이터 최신 상태 확인
    const inviterDoc = await getDoc(inviterDocRef);
    const inviterData = inviterDoc.data();
    
    return true;
  } catch (error) {
    console.error('Error processing invitation:', error);
    return false;
  }
};

// 초대 코드 검증 함수
export const validateInviteCode = (inviteCode) => {
  // 간단한 형식 확인 (실제로는 더 복잡한 검증이 필요할 수 있음)
  const parts = inviteCode.split('_');
  return parts.length === 3;
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