// src/features/friends/utils/inviteCodeUtils.js
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';

// 초대 코드 생성 함수 - 사용자 ID와 랜덤 문자를 조합하여 고유한 초대 코드 생성
export const generateInviteCode = (userId) => {
  // 랜덤 문자열 생성 (6자리)
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  // 사용자 ID 마지막 4자리와 랜덤 문자열 조합
  const userIdSuffix = userId.substring(Math.max(0, userId.length - 4));
  return `${randomChars}${userIdSuffix}`;
};

// 초대 코드 검증 함수
export const verifyInviteCode = async (code) => {
  try {
    // 코드가 없거나 너무 짧으면 유효하지 않음
    if (!code || code.length < 10) {
      return { success: false, message: '유효하지 않은 초대 코드 형식입니다.' };
    }
    
    // 초대 코드로 사용자 찾기
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('inviteCode', '==', code));
    const querySnapshot = await getDocs(q);
    
    // 해당 코드를 가진 사용자가 없는 경우
    if (querySnapshot.empty) {
      return { success: false, message: '존재하지 않는 초대 코드입니다.' };
    }
    
    // 초대자 정보 반환
    const inviterDoc = querySnapshot.docs[0];
    const inviterId = inviterDoc.id;
    const inviterData = inviterDoc.data();
    
    return { 
      success: true, 
      inviterId, 
      inviterName: inviterData.username || inviterData.firstName || '사용자'
    };
  } catch (error) {
    console.error('초대 코드 검증 오류:', error);
    return { success: false, message: '초대 코드 검증 중 오류가 발생했습니다.' };
  }
};

// 초대 처리 함수
export const processInvitation = async (inviterCode, inviteeId) => {
  try {
    // 초대 코드 검증
    const verification = await verifyInviteCode(inviterCode);
    
    if (!verification.success) {
      return verification;
    }
    
    const { inviterId } = verification;
    
    // 자기 자신을 초대할 수 없음
    if (inviterId === inviteeId) {
      return { success: false, message: '자기 자신을 초대할 수 없습니다.' };
    }
    
    // 초대 받은 사용자 확인
    const inviteeDocRef = doc(db, 'users', inviteeId);
    const inviteeDoc = await getDoc(inviteeDocRef);
    
    if (!inviteeDoc.exists()) {
      return { success: false, message: '사용자 정보를 찾을 수 없습니다.' };
    }
    
    // 이미 초대된 사용자인지 확인
    if (inviteeDoc.data().invitedBy) {
      return { success: false, message: '이미 초대를 통해 가입한 사용자입니다.' };
    }
    
    // 초대자 문서 참조
    const inviterDocRef = doc(db, 'users', inviterId);
    const inviterDoc = await getDoc(inviterDocRef);
    
    if (!inviterDoc.exists()) {
      return { success: false, message: '초대자 정보를 찾을 수 없습니다.' };
    }
    
    // 초대 받은 사용자 정보
    const inviteeData = inviteeDoc.data();
    
    // 새 친구 정보
    const newFriend = {
      userId: inviteeId,
      username: inviteeData.username || null,
      firstName: inviteeData.firstName || null,
      lastName: inviteeData.lastName || null,
      joinedAt: new Date().toISOString(),
      status: 'active'
    };
    
    // 초대 받은 사용자 업데이트 - 5 CGP 보상 (500 -> 5)
    await updateDoc(inviteeDocRef, {
      invitedBy: inviterId,
      invitedAt: new Date(),
      points: increment(5), // 초대 받은 사람 5 CGP 보상
      rewardHistory: arrayUnion({
        type: 'invitation_reward',
        amount: 5,
        date: new Date().toISOString(),
        description: '친구 초대 보상'
      })
    });
    
    // 초대자 업데이트 - 10 CGP 보상 (1000 -> 10)
    await updateDoc(inviterDocRef, {
      points: increment(10), // 초대한 사람 10 CGP 보상
      invitationBonus: increment(10),
      invitationCount: increment(1),
      friends: arrayUnion(newFriend),
      rewardHistory: arrayUnion({
        type: 'invitation_bonus',
        amount: 10,
        date: new Date().toISOString(),
        description: '친구 초대 보너스'
      }),
      updatedAt: new Date()
    });
    
    return { 
      success: true, 
      message: '초대 처리가 완료되었습니다.',
      inviterName: inviterDoc.data().username || inviterDoc.data().firstName || '사용자',
      inviteeReward: 5,
      inviterReward: 10
    };
  } catch (error) {
    console.error('초대 처리 오류:', error);
    return { success: false, message: `초대 처리 중 오류가 발생했습니다: ${error.message}` };
  }
};

// 사용자의 초대 통계 조회 함수
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