import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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


// 광고 시청 카운트 초기화 함수 (일별 리셋)
export const resetAdViewCountIfNeeded = async (userId) => {
  if (!userId) return null;
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastReset = userData.lastAdResetDay;
      
      // 마지막 리셋일이 오늘이 아니면 카운트 초기화
      if (lastReset !== today) {
        await updateDoc(userRef, {
          adViewCount: 0,
          lastAdResetDay: today,
          updatedAt: new Date()
        });
        
        return {
          ...userData,
          adViewCount: 0,
          lastAdResetDay: today
        };
      }
      
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('광고 카운트 초기화 오류:', error);
    return null;
  }
};

// 광고 시청 보상 처리 함수
export const processAdReward = async (userId, rewardAmount = 10) => {
  if (!userId) return { success: false, message: '사용자 ID가 필요합니다' };
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: '사용자를 찾을 수 없습니다' };
    }
    
    const userData = userDoc.data();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 일일 초기화 확인
    let adViewCount = userData.adViewCount || 0;
    if (userData.lastAdResetDay !== today) {
      adViewCount = 0;
    }
    
    // 최대 횟수 확인
    if (adViewCount >= 10) {
      return { 
        success: false, 
        message: '오늘 최대 광고 시청 횟수에 도달했습니다',
        userData 
      };
    }
    
    // 포인트 및 광고 시청 횟수 업데이트
    const updatedData = {
      points: (userData.points || 0) + rewardAmount,
      adViewCount: adViewCount + 1,
      totalAdViews: (userData.totalAdViews || 0) + 1,
      lastAdResetDay: today,
      updatedAt: new Date(),
      // 보상 내역 추가
      rewardHistory: arrayUnion({
        type: 'ad_reward',
        amount: rewardAmount,
        date: new Date().toISOString(),
        description: '광고 시청 보상'
      })
    };
    
    await updateDoc(userRef, updatedData);
    
    return {
      success: true,
      message: `${rewardAmount} CGP 보상이 지급되었습니다`,
      userData: { ...userData, ...updatedData },
      newBalance: (userData.points || 0) + rewardAmount,
      adViewCount: adViewCount + 1
    };
  } catch (error) {
    console.error('광고 보상 처리 오류:', error);
    return { success: false, message: '보상 처리 중 오류가 발생했습니다' };
  }
};