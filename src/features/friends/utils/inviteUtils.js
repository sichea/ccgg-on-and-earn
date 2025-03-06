import { db } from '../../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

// 초대 링크 생성 함수
export const generateInviteLink = (userId) => {
  // 봇 이름 가져오기 (환경 변수 또는 기본값 사용)
  const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'CCGGMingBot';
  
  // 초대 링크 생성 및 반환
  return `https://t.me/${botName}?start=invite_${userId}`;
};

// 초대 코드 검증 및 초대자 ID 추출 함수
export const validateInviteCode = (inviteCode) => {
  try {
    console.log('검증 중인 초대 코드:', inviteCode);
    
    if (!inviteCode) {
      console.log('초대 코드가 없습니다');
      return null;
    }
    
    // invite_USERID 형식 확인
    if (inviteCode.startsWith('invite_')) {
      const inviterId = inviteCode.replace('invite_', '');
      console.log('추출된 초대자 ID:', inviterId);
      return inviterId;
    }
    
    // 다른 형식이라면 null 반환
    console.log('유효하지 않은 초대 코드 형식:', inviteCode);
    return null;
  } catch (error) {
    console.error('초대 코드 검증 오류:', error);
    return null;
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
    
    return {
      totalInvited: 0,
      totalBonus: 0,
      friends: []
    };
  } catch (error) {
    console.error('초대 통계 조회 오류:', error);
    return {
      totalInvited: 0,
      totalBonus: 0,
      friends: []
    };
  }
};