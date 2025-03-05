import React, { useState, useEffect } from 'react';
import '../styles/FriendsStyles.css';
import InvitationBonus from '../components/InvitationBonus';
import RewardInfo from '../components/RewardInfo';
import FriendList from '../components/FriendList';
import InviteButton from '../components/InviteButton';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { getInvitationStats } from '../utils/inviteUtils';

// 친구 초대용 이미지 import (assets 폴더에 추가 필요)
import friendsImage from '../../../assets/images/friends-characters.png';

const Friends = ({ telegramUser }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 사용자 데이터 갱신 함수
  const refreshUserData = async () => {
    if (!telegramUser?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userId = telegramUser.id.toString();
      console.log('사용자 데이터 갱신 시작:', userId);
      
      // 사용자 문서 가져오기
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        console.log('사용자 문서 찾음');
        const userData = userDoc.data();
        
        // 초대 통계 정보 가져오기
        const invitationStats = await getInvitationStats(userId);
        console.log('초대 통계:', invitationStats);
        
        // 사용자 데이터와 초대 통계 정보 병합
        setUserData({
          ...userData,
          id: userId,
          invitationBonus: invitationStats.totalBonus,
          friends: invitationStats.friends
        });
      } else {
        console.log('사용자 문서 없음, 빈 데이터 사용');
        setUserData({
          id: userId,
          points: 0,
          invitationBonus: 0,
          friends: []
        });
      }
    } catch (error) {
      console.error('사용자 데이터 가져오기 오류:', error);
      setError('사용자 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    refreshUserData();
    
    // 10초마다 데이터 새로고침 (초대 처리가 지연될 수 있으므로)
    const intervalId = setInterval(refreshUserData, 10000);
    
    return () => clearInterval(intervalId);
  }, [telegramUser]);
  
  // 로딩 중인 경우
  if (loading) {
    return (
      <div className="friends-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }
  
  // 오류가 발생한 경우
  if (error) {
    return (
      <div className="friends-container">
        <div className="error-message">{error}</div>
        <button 
          className="retry-button" 
          onClick={refreshUserData}
          style={{ margin: '16px auto', display: 'block' }}
        >
          다시 시도
        </button>
      </div>
    );
  }
  
  // 사용자 정보가 없는 경우
  if (!telegramUser?.id) {
    return (
      <div className="friends-container">
        <div className="login-message-container">
          <h2>텔레그램 로그인이 필요합니다</h2>
          <p>친구 초대 기능을 사용하려면 텔레그램으로 로그인해주세요.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="friends-container">
      <h1 className="friends-title">INVITE FRIENDS</h1>
      <p className="friends-subtitle">Invite a friend and get Bonuses</p>
      
      <div className="friends-image-container">
        <img src={friendsImage} alt="Friends" className="friends-image" />
      </div>
      
      <InvitationBonus bonus={userData?.invitationBonus || 0} />
      
      <div className="rewards-container">
        <RewardInfo 
          icon="🪙" 
          text="Earn 1,000 MOPI for each friend invited" 
          hasInfoIcon={true}
        />
      </div>
      
      <div className="refresh-container">
        <button className="refresh-button" onClick={refreshUserData}>
          새로고침
        </button>
      </div>
      
      <FriendList friends={userData?.friends || []} />
      
      <div className="invite-actions">
        <InviteButton telegramUser={telegramUser} />
      </div>
    </div>
  );
};

export default Friends;