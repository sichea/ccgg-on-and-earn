import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// 사용자 문서 가져오기 (없으면 생성)
export const getUserDocument = async (telegramUser) => {
  if (!telegramUser?.id) return null;
  
  const userId = telegramUser.id.toString();
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
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
      
      if (startParam && startParam.startsWith('invite_')) {
        // 초대 코드 처리는 사용자 생성 후 별도 함수에서 처리
        userData.pendingInviteCode = startParam;
      }
      
      await setDoc(userRef, userData);
      
      // 초대 코드 처리 (있는 경우)
      if (userData.pendingInviteCode) {
        try {
          // inviteUtils에서 처리 함수 import - 필요시 import
          const { handleInviteParameter } = await import('../features/friends/utils/inviteUtils');
          await handleInviteParameter(userData.pendingInviteCode, userId);
          
          // 처리 후 pendingInviteCode 필드 제거
          await updateDoc(userRef, {
            pendingInviteCode: null
          });
        } catch (inviteError) {
          console.error('초대 코드 처리 오류:', inviteError);
        }
      }
      
      return { ...userData, id: userId };
    }
    
    return { ...userDoc.data(), id: userId };
  } catch (error) {
    console.error('Error fetching/creating user document:', error);
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
      await updateDoc(userRef, data);
    } else {
      await setDoc(userRef, { 
        ...data, 
        createdAt: new Date(),
        // 친구 초대 관련 필드도 기본값으로 초기화
        invitationBonus: 0,
        invitationCount: 0,
        friends: []
      });
    }
    
    const updatedDoc = await getDoc(userRef);
    return { ...updatedDoc.data(), id: userId };
  } catch (error) {
    console.error('Error updating user document:', error);
    return null;
  }
};

// ID 접두사로 사용자 찾기
export const findUserByIdPrefix = async (idPrefix) => {
  try {
    if (!idPrefix || idPrefix.length < 3) return null;
    
    // 사용자 컬렉션 쿼리
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    // 접두사가 일치하는 사용자 찾기
    let matchingUser = null;
    querySnapshot.forEach((doc) => {
      if (doc.id.startsWith(idPrefix)) {
        matchingUser = { id: doc.id, ...doc.data() };
      }
    });
    
    return matchingUser;
  } catch (error) {
    console.error('Error finding user by ID prefix:', error);
    return null;
  }
};