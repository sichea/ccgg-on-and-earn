import React, { useState, useEffect } from 'react';
import '../styles/FriendsStyles.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

// 친구 초대용 이미지 import (assets 폴더에 추가 필요)
import friendsImage from '../../../assets/images/friends-characters.png';

const Friends = ({ telegramUser }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!telegramUser?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const userId = telegramUser.id.toString();
        
        // 사용자 문서 가져오기
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setUserData({
            invitationBonus: 0,
            friends: []
          });
        }
      } catch (error) {
        console.error('사용자 데이터 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [telegramUser]);
  
  // 초대 링크 생성 및 복사 함수
  const handleInviteFriend = async () => {
    try {
      // 텔레그램 사용자 정보 확인
      if (!telegramUser?.id) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 사용자 ID를 문자열로 확실히 변환
      const userId = telegramUser.id.toString();
      
      // 봇 이름 가져오기
      const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'CCGGMingBot';
      
      // 직접 초대 링크 생성
      const link = `https://t.me/${botName}?start=invite_${userId}`;
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(link);
      
      console.log(`초대 링크 생성 및 복사 완료: ${link}`);
      // 성공 메시지 표시
      setCopySuccess(true);
      
      // 3초 후 성공 메시지 초기화
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch (error) {
      console.error('초대 링크 생성 오류:', error);
      alert('초대 링크 생성 중 오류가 발생했습니다.');
    }
  };
  
  if (loading) {
    return (
      <div className="friends-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }
  
  const friends = userData?.friends || [];
  const invitationBonus = userData?.invitationBonus || 0;
  
  return (
    <div className="friends-container">
      <h1 className="friends-title">INVITE FRIENDS</h1>
      <p className="friends-subtitle">Invite a friend and get Bonuses</p>
      
      <div className="friends-image-container">
        <img src={friendsImage} alt="Friends" className="friends-image" />
      </div>
      
      <div className="invitation-bonus-container">
        <div className="invitation-bonus-title">My Invitation bonus</div>
        <div className="invitation-bonus-value">
          <span className="invitation-bonus-coin">🪙</span>
          <span>{invitationBonus}</span>
        </div>
      </div>
      
      <div className="rewards-container">
        <div className="reward-item">
          <div className="reward-icon">🪙</div>
          <div className="reward-text">
            Earn 1,000 MOPI for each friend invited
            <span className="info-icon">ⓘ</span>
          </div>
        </div>
      </div>
      
      <div className="friend-list-section">
        <div className="friend-list-header">
          <h2 className="friend-list-title">Friend List</h2>
          <span className="friend-list-count">{friends.length}</span>
        </div>
        
        {friends.length === 0 ? (
          <div className="friend-empty-message">
            <p>You don't have any friends yet.</p>
            <p>Invite your friends now!</p>
          </div>
        ) : (
          <div className="friend-list">
            {friends.map((friend, index) => (
              <div key={index} className="friend-item">
                <span className="friend-name">
                  {friend.username ? `@${friend.username}` : 
                   (friend.firstName ? `${friend.firstName} ${friend.lastName || ''}` : 
                   `사용자 ${friend.userId}`)}
                </span>
                <span className="friend-status">{friend.status || 'active'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button 
        className={`invite-button ${copySuccess ? 'success' : ''}`} 
        onClick={handleInviteFriend}
      >
        <span>친구 초대하기</span>
        <span style={{ marginLeft: '8px' }}>👤</span>
      </button>
    </div>
  );
};

export default Friends;