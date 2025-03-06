import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generateInviteCode } from '../features/friends/utils/inviteCodeUtils';

// 사용자 문서 가져오기 (없으면 생성)
export const getUserDocument = async (telegramUser) => {
  if (!telegramUser?.id) return null;
  
  const userId = telegramUser.id.toString();
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('사용자 문서가 없어 새로 생성합니다.', userId);
      
      // 초대 코드 생성
      const inviteCode = generateInviteCode(userId);
      
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
        inviteCode: inviteCode,
        invitationBonus: 0,
        invitationCount: 0,
        friends: [],
        rewardHistory: []
      };
      
      // 사용자 문서 생성
      await setDoc(userRef, userData);
      
      // 업데이트된 사용자 문서 반환
      const freshUserDoc = await getDoc(userRef);
      return { ...freshUserDoc.data(), id: userId };
    }
    
    return { ...userDoc.data(), id: userId };
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
      const inviteCode = generateInviteCode(userId);
      
      await setDoc(userRef, { 
        ...data, 
        createdAt: new Date(),
        updatedAt: new Date(),
        inviteCode: inviteCode,
        // 친구 초대 관련 필드도 기본값으로 초기화
        invitationBonus: data.invitationBonus || 0,
        invitationCount: data.invitationCount || 0,
        friends: data.friends || [],
        rewardHistory: data.rewardHistory || []
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