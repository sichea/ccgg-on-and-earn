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
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!telegramUser?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const userId = telegramUser.id.toString();
        console.log('사용자 데이터 가져오기 시작:', userId);
        
        // 사용자 문서 가져오기
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // 사용자 문서가 존재하는 경우
          console.log('사용자 문서 찾음');
          const userData = userDoc.data();
          
          // 초대 통계 정보 가져오기
          const invitationStats = await getInvitationStats(userId);
          
          // 사용자 데이터와 초대 통계 정보 병합
          setUserData({
            ...userData,
            id: userId,
            invitationBonus: invitationStats.totalBonus,
            friends: invitationStats.friends
          });
        } else {
          // 사용자 문서가 존재하지 않는 경우
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
    
    fetchUserData();
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
      
      <FriendList friends={userData?.friends || []} />
      
      <div className="invite-actions">
        <InviteButton telegramUser={telegramUser} />
      </div>
    </div>
  );
};

export default Friends;