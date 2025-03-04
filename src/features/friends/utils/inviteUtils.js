import { db } from '../../../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// 초대 코드 검증 및 초대자 ID 추출 함수
export const validateInviteCode = (inviteCode) => {
  try {
    console.log('검증 중인 초대 코드:', inviteCode);
    
    if (!inviteCode) {
      console.log('초대 코드가 없습니다');
      return null;
    }
    
    // 코드 형식 검증 (userId_timestamp_randomStr)
    const parts = inviteCode.split('_');
    if (parts.length !== 3) {
      console.log('유효하지 않은 초대 코드 형식:', inviteCode);
      return null;
    }
    
    // 초대자 ID 추출 (첫 번째 부분이 ID)
    const inviterId = parts[0];
    console.log('추출된 초대자 ID:', inviterId);
    
    // 초대자 ID가 숫자인지 확인
    if (!/^\d+$/.test(inviterId)) {
      console.log('유효하지 않은 초대자 ID 형식:', inviterId);
      return null;
    }
    
    return inviterId;
  } catch (error) {
    console.error('초대 코드 검증 오류:', error);
    return null;
  }
};

// 초대 코드 생성 함수
export const generateInviteCode = (userId) => {
  // 사용자 ID와 타임스탬프를 조합하여 코드 생성
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${userId}_${timestamp}_${randomStr}`;
};

// 초대 링크 생성 함수
export const generateInviteLink = (userId) => {
  const inviteCode = generateInviteCode(userId);
  const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'CCGGMingBot';
  // invite_ 접두사 없이 일관된 형식 사용
  return `https://t.me/${botName}?start=${inviteCode}`;
};

// 친구 목록에 추가하는 별도 함수
const addToFriendsList = async (inviterUserId, inviteeUserId) => {
  try {
    const inviterDocRef = doc(db, 'users', inviterUserId);
    await updateDoc(inviterDocRef, {
      friends: arrayUnion({
        userId: inviteeUserId,
        joinedAt: new Date().toISOString(),
        status: 'active'
      })
    });
    return true;
  } catch (error) {
    console.error('친구 목록 업데이트 오류:', error);
    return false;
  }
};

// 초대 완료 처리 함수
export const processInvitation = async (inviterUserId, inviteeUserId) => {
  try {
    console.log(`처리 중: 초대자 ${inviterUserId}, 초대된 사용자 ${inviteeUserId}`);
    
    // 문자열로 변환
    inviterUserId = inviterUserId.toString();
    inviteeUserId = inviteeUserId.toString();
    
    // 기본 검증
    if (inviterUserId === inviteeUserId) {
      console.log('자기 자신을 초대할 수 없습니다.');
      return false;
    }
    
    // 초대된 사용자 체크
    const inviteeDocRef = doc(db, 'users', inviteeUserId);
    const inviteeDoc = await getDoc(inviteeDocRef);
    
    if (inviteeDoc.exists() && inviteeDoc.data().invitedBy) {
      console.log('이미 초대된 사용자입니다.');
      return false;
    }
    
    // 초대자 문서 확인
    const inviterDocRef = doc(db, 'users', inviterUserId);
    const inviterDoc = await getDoc(inviterDocRef);
    
    if (!inviterDoc.exists()) {
      console.log('초대자를 찾을 수 없습니다.');
      return false;
    }
    
    // 초대된 사용자 업데이트
    await updateDoc(inviteeDocRef, {
      invitedBy: inviterUserId,
      invitedAt: new Date()
    });
    
    // DailyClaim과 유사한 방식으로 초대자 업데이트
    const currentPoints = inviterDoc.data().points || 0;
    
    // 초대자에게 보상 지급 (하나의 간단한 업데이트)
    await updateDoc(inviterDocRef, {
      points: currentPoints + 1000,
      invitationBonus: (inviterDoc.data().invitationBonus || 0) + 1000,
      invitationCount: (inviterDoc.data().invitationCount || 0) + 1
    });
    
    console.log('초대 보상 지급 완료!');
    
    // 친구 목록 업데이트 (분리된 작업)
    await addToFriendsList(inviterUserId, inviteeUserId);
    
    return true;
  } catch (error) {
    console.error('초대 처리 오류:', error);
    return false;
  }
};

// 초대 파라미터 처리 함수 (텔레그램 봇 start 파라미터)
export const handleInviteParameter = async (startParam, inviteeUserId) => {
  try {
    if (!startParam || !inviteeUserId) {
      console.log('필수 파라미터 누락');
      return false;
    }
    
    console.log('초대 파라미터 처리 중:', startParam, '초대된 사용자:', inviteeUserId);
    
    // 초대 코드 검증 및 초대자 ID 추출
    const inviterId = validateInviteCode(startParam);
    if (!inviterId) {
      console.log('유효하지 않은 초대 코드');
      return false;
    }
    
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