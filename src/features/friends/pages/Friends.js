import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import '../styles/FriendsStyles.css';

// 친구 초대용 이미지 import (assets 폴더에 추가 필요)
import friendsImage from '../../../assets/images/friends-characters.png';
import { generateInviteCode, processInvitation } from '../utils/inviteCodeUtils';

const Friends = ({ telegramUser }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const userId = telegramUser?.id?.toString() || '';
  
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
          const userInfo = userDoc.data();
          setUserData(userInfo);
          
          // 초대 코드가 없으면 생성
          if (!userInfo.inviteCode) {
            const newInviteCode = generateInviteCode(userId);
            await updateDoc(userRef, { 
              inviteCode: newInviteCode,
              updatedAt: new Date()
            });
            setInviteCode(newInviteCode);
          } else {
            setInviteCode(userInfo.inviteCode);
          }
        } else {
          // 사용자 문서가 없는 경우 기본값으로 초기화
          setUserData({
            invitationBonus: 0,
            friends: []
          });
          // 새 초대 코드 생성
          const newInviteCode = generateInviteCode(userId);
          setInviteCode(newInviteCode);
        }
      } catch (error) {
        console.error('사용자 데이터 가져오기 오류:', error);
        setErrorMessage('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [telegramUser]);
  
  // 초대 코드 복사 함수
  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch (error) {
      console.error('복사 오류:', error);
      setErrorMessage('코드 복사 중 오류가 발생했습니다.');
    }
  };
  
  // 초대 코드 입력 처리
  const handleSubmitCode = async (e) => {
    e.preventDefault();
    
    if (!inputCode.trim()) {
      setErrorMessage('초대 코드를 입력해주세요.');
      return;
    }
    
    if (!userId) {
      setErrorMessage('로그인이 필요합니다.');
      return;
    }
    
    setProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // 입력된 코드로 초대 처리
      const result = await processInvitation(inputCode.trim(), userId);
      
      if (result.success) {
        setSuccessMessage(`${result.inviterName}님의 초대가 처리되었습니다! ${result.inviteeReward} CGP를 받았습니다.`);
        setInputCode('');
        
        // 사용자 데이터 다시 불러오기
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error('초대 처리 오류:', error);
      setErrorMessage('초대 코드 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
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
      <p className="friends-subtitle">초대 코드를 공유하고 보상을 받으세요</p>
      
      <div className="friends-image-container">
        <img src={friendsImage} alt="Friends" className="friends-image" />
      </div>
      
      {/* 내 초대 코드 섹션 */}
      <div className="my-invite-code-container">
        <h2 className="section-title">내 초대 코드</h2>
        <div className="invite-code-box">
          <span className="invite-code">{inviteCode}</span>
          <button 
            className={`copy-button ${copySuccess ? 'success' : ''}`} 
            onClick={handleCopyInviteCode}
          >
            {copySuccess ? '복사완료!' : '복사'}
          </button>
        </div>
        <p className="invite-code-info">
          친구에게 이 코드를 공유하세요. 친구가 코드를 입력하면 두 분 모두 보상을 받습니다!
        </p>
      </div>
      
      {/* 초대 코드 입력 섹션 */}
      <div className="code-input-container">
        <h2 className="section-title">초대 코드 입력</h2>
        <form onSubmit={handleSubmitCode} className="code-input-form">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="친구의 초대 코드 입력"
            className="code-input"
            disabled={processing || userData?.invitedBy}
          />
          <button 
            type="submit"
            className="submit-button"
            disabled={processing || userData?.invitedBy}
          >
            {processing ? '처리 중...' : '입력'}
          </button>
        </form>
        
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        {userData?.invitedBy && (
          <p className="already-invited">이미 초대를 통해 가입하셨습니다.</p>
        )}
      </div>
      
      <div className="invitation-bonus-container">
        <div className="invitation-bonus-title">나의 초대 보너스</div>
        <div className="invitation-bonus-value">
          <span className="invitation-bonus-coin">🪙</span>
          <span>{invitationBonus}</span>
        </div>
      </div>
      
      <div className="rewards-container">
        <div className="reward-item">
          <div className="reward-icon">🪙</div>
          <div className="reward-text">
            친구 초대시 10 CGP 획득
          </div>
        </div>
        <div className="reward-item">
          <div className="reward-icon">👤</div>
          <div className="reward-text">
            초대받은 친구는 5 CGP 획득
          </div>
        </div>
      </div>
      
      <div className="friend-list-section">
        <div className="friend-list-header">
          <h2 className="friend-list-title">친구 목록</h2>
          <span className="friend-list-count">{friends.length}</span>
        </div>
        
        {friends.length === 0 ? (
          <div className="friend-empty-message">
            <p>아직 초대한 친구가 없습니다.</p>
            <p>친구들을 초대해보세요!</p>
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
    </div>
  );
};

export default Friends;