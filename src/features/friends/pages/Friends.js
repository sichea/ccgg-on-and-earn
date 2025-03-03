import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/FriendsStyles.css';
import InvitationBonus from '../components/InvitationBonus';
import RewardInfo from '../components/RewardInfo';
import FriendList from '../components/FriendList';
import InviteButton from '../components/InviteButton';
import { getUserDocument, updateUserDocument } from '../../../utils/userUtils';

// 친구 초대용 이미지 import (assets 폴더에 추가 필요)
import friendsImage from '../../../assets/images/friends-characters.png';

const Friends = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserDocument();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
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
        <InviteButton />
      </div>
    </div>
  );
};

export default Friends;