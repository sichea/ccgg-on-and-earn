import { db } from '../../../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

// 간단한 초대 코드 생성 함수 - invite_USERID 형식 사용
export const generateInviteCode = (userId) => {
  return `invite_${userId}`;
};

// 초대 링크 생성 함수
export const generateInviteLink = (userId) => {
  // 초대 코드 생성
  const inviteCode = generateInviteCode(userId);
  
  // 봇 이름 가져오기 (환경 변수 또는 기본값 사용)
  const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'CCGGMingBot';
  
  // 초대 링크 생성 및 반환
  return `https://t.me/${botName}?start=${inviteCode}`;
};

// 초대 코드 검증 및 초대자 ID 추출 함수
export const validateInviteCode = (inviteCode) => {
  try {
    console.log('검증 중인 초대 코드:', inviteCode);
    
    if (!inviteCode) {
      console.log('초대 코드가 없습니다');
      return null;
    }
    
    // 새로운 형식: invite_USERID
    if (inviteCode.startsWith('invite_')) {
      const inviterId = inviteCode.replace('invite_', '');
      console.log('추출된 초대자 ID:', inviterId);
      return inviterId;
    }
    
    // 기존 형식 지원 (userId_timestamp_randomStr)
    const parts = inviteCode.split('_');
    if (parts.length === 3) {
      const inviterId = parts[0];
      console.log('기존 형식에서 추출된 초대자 ID:', inviterId);
      return inviterId;
    }
    
    console.log('유효하지 않은 초대 코드 형식:', inviteCode);
    return null;
  } catch (error) {
    console.error('초대 코드 검증 오류:', error);
    return null;
  }
};

// 초대 완료 처리 함수
export const processInvitation = async (inviterId, inviteeId) => {
  try {
    console.log(`초대 처리 시작: 초대자 ${inviterId}, 초대된 사용자 ${inviteeId}`);
    
    // 문자열로 확실히 변환
    inviterId = inviterId.toString();
    inviteeId = inviteeId.toString();
    
    // 기본 검증 - 자기 자신을 초대할 수 없음
    if (inviterId === inviteeId) {
      console.log('자기 자신을 초대할 수 없습니다.');
      return { success: false, message: '자기 자신을 초대할 수 없습니다.' };
    }
    
    // 초대자 문서 확인
    const inviterDocRef = doc(db, 'users', inviterId);
    const inviterDoc = await getDoc(inviterDocRef);
    
    if (!inviterDoc.exists()) {
      console.log('초대자를 찾을 수 없습니다.');
      return { success: false, message: '초대자를 찾을 수 없습니다.' };
    }
    
    // 초대받은 사용자 체크 - 이미 초대된 사용자인지 확인
    const inviteeDocRef = doc(db, 'users', inviteeId);
    const inviteeDoc = await getDoc(inviteeDocRef);
    
    if (inviteeDoc.exists() && inviteeDoc.data().invitedBy) {
      console.log('이미 초대된 사용자입니다.');
      return { success: false, message: '이미 초대된 사용자입니다.' };
    }
    
    // 초대된 사용자 정보 가져오기
    let inviteeUsername = null;
    let inviteeFirstName = null;
    let inviteeLastName = null;
    
    if (inviteeDoc.exists()) {
      const inviteeData = inviteeDoc.data();
      inviteeUsername = inviteeData.username;
      inviteeFirstName = inviteeData.firstName;
      inviteeLastName = inviteeData.lastName;
    }
    
    // 초대된 사용자 업데이트
    await updateDoc(inviteeDocRef, {
      invitedBy: inviterId,
      invitedAt: new Date()
    });
    
    // 새 친구 정보 생성
    const newFriend = {
      userId: inviteeId,
      username: inviteeUsername,
      firstName: inviteeFirstName,
      lastName: inviteeLastName,
      joinedAt: new Date().toISOString(),
      status: 'active'
    };
    
    console.log('초대자에게 보상 지급 및 친구 추가:', newFriend);
    
    // 초대자 업데이트 - 점수 증가 및 친구 추가
    await updateDoc(inviterDocRef, {
      points: increment(1000),
      invitationBonus: increment(1000),
      invitationCount: increment(1),
      friends: arrayUnion(newFriend)
    });
    
    console.log('초대 처리 성공!');
    return { 
      success: true, 
      message: '초대 처리 성공!',
      inviteeName: inviteeUsername || inviteeFirstName || '친구'
    };
  } catch (error) {
    console.error('초대 처리 오류:', error);
    return { success: false, message: `초대 처리 중 오류 발생: ${error.message}` };
  }
};

// 초대 링크 파라미터 처리 함수 (텔레그램 봇 start 파라미터)
export const handleInviteParameter = async (startParam, inviteeId) => {
  try {
    if (!startParam || !inviteeId) {
      console.log('필수 파라미터 누락');
      return { success: false, message: '필수 파라미터가 누락되었습니다.' };
    }
    
    console.log('초대 파라미터 처리 중:', startParam, '초대된 사용자:', inviteeId);
    
    // 초대 코드 검증 및 초대자 ID 추출
    const inviterId = validateInviteCode(startParam);
    if (!inviterId) {
      console.log('유효하지 않은 초대 코드');
      return { success: false, message: '유효하지 않은 초대 코드입니다.' };
    }
    
    // 초대 처리
    return await processInvitation(inviterId, inviteeId);
  } catch (error) {
    console.error('초대 파라미터 처리 오류:', error);
    return { success: false, message: `초대 파라미터 처리 중 오류 발생: ${error.message}` };
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