import { db } from '../../../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

// 초대 코드 생성 함수
export const generateInviteCode = (userId) => {
  // 사용자 ID와 타임스탬프, 랜덤 문자열을 조합하여 코드 생성
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${userId}_${timestamp}_${randomStr}`;
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
    
    // 초대된 사용자 체크 - 이미 초대된 사용자인지 확인
    const inviteeDocRef = doc(db, 'users', inviteeId);
    const inviteeDoc = await getDoc(inviteeDocRef);
    
    if (inviteeDoc.exists() && inviteeDoc.data().invitedBy) {
      console.log('이미 초대된 사용자입니다.');
      return { success: false, message: '이미 초대된 사용자입니다.' };
    }
    
    // 초대자 문서 확인
    const inviterDocRef = doc(db, 'users', inviterId);
    const inviterDoc = await getDoc(inviterDocRef);
    
    if (!inviterDoc.exists()) {
      console.log('초대자를 찾을 수 없습니다.');
      return { success: false, message: '초대자를 찾을 수 없습니다.' };
    }
    
    // 초대된 사용자 정보 가져오기
    let inviteeName = '알 수 없음';
    let inviteeUsername = null;
    let inviteeFirstName = null;
    let inviteeLastName = null;
    
    if (inviteeDoc.exists()) {
      const inviteeData = inviteeDoc.data();
      inviteeUsername = inviteeData.username;
      inviteeFirstName = inviteeData.firstName;
      inviteeLastName = inviteeData.lastName;
      
      // 사용자명 결정 (우선순위: username > firstName+lastName > userId)
      if (inviteeUsername) {
        inviteeName = `@${inviteeUsername}`;
      } else if (inviteeFirstName) {
        inviteeName = `${inviteeFirstName} ${inviteeLastName || ''}`.trim();
      } else {
        inviteeName = `사용자 ${inviteeId}`;
      }
    }
    
    // 트랜잭션 처리를 위한 업데이트 작업 - 원자적 연산 사용
    
    // 1. 초대된 사용자 업데이트
    await updateDoc(inviteeDocRef, {
      invitedBy: inviterId,
      invitedAt: new Date()
    });
    
    // 2. 초대자에게 보상 지급 및 친구 추가
    const newFriend = {
      userId: inviteeId,
      username: inviteeUsername,
      firstName: inviteeFirstName,
      lastName: inviteeLastName,
      joinedAt: new Date().toISOString(),
      status: 'active'
    };
    
    await updateDoc(inviterDocRef, {
      // increment 함수 사용으로 원자적 연산 수행
      points: increment(1000),
      invitationBonus: increment(1000),
      invitationCount: increment(1),
      // arrayUnion 함수로 중복 없이 배열에 추가
      friends: arrayUnion(newFriend)
    });
    
    console.log('초대 처리 성공!');
    return { 
      success: true, 
      message: '초대 처리 성공!',
      inviteeName: inviteeName
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