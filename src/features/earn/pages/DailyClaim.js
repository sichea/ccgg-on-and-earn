import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import ClaimTimer from '../components/ClaimTimer';
import { getUserDocument, updateUserDocument } from '../../../utils/userUtils';
import '../styles/EarnStyles.css';
import ccggLogo from "../../../assets/images/ccgg-logo.png";

const DailyClaim = ({ telegramUser, isAdmin }) => {
  const [userPoints, setUserPoints] = useState(0);
  const [dailyAmount, setDailyAmount] = useState(1000);
  const [lastClaimTime, setLastClaimTime] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [userId, setUserId] = useState(telegramUser?.id?.toString() || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // telegramUser가 변경될 때 userId 업데이트
    if (telegramUser && telegramUser.id) {
      setUserId(telegramUser.id.toString());
    }
  }, [telegramUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !telegramUser) return;
      
      setIsLoading(true);
      try {
        // 통합된 유틸리티 함수 사용
        const userData = await getUserDocument(telegramUser);
        
        if (userData) {
          setUserPoints(userData.points || 0);
          setLastClaimTime(userData.lastClaimTime?.toDate() || null);
        }
        
        // 관리자 설정에서 일일 보상 금액 가져오기
        const settingsRef = doc(db, 'settings', 'dailyRewards');
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          setDailyAmount(settingsDoc.data().amount || 1000);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, telegramUser]);

  useEffect(() => {
    // 마지막 클레임 시간 체크하여 클레임 가능 여부 결정
    const checkClaimEligibility = () => {
      if (!lastClaimTime) {
        setCanClaim(true);
        setTimeRemaining(null);
        return;
      }

      const now = new Date();
      const timeDiff = now - lastClaimTime; // 밀리초 단위
      const hoursPassed = timeDiff / (1000 * 60 * 60);
      
      if (hoursPassed >= 24) {
        setCanClaim(true);
        setTimeRemaining(null);
      } else {
        setCanClaim(false);
        const remainingMs = (24 * 60 * 60 * 1000) - timeDiff;
        setTimeRemaining(remainingMs);
      }
    };

    checkClaimEligibility();
    const interval = setInterval(checkClaimEligibility, 1000);
    
    return () => clearInterval(interval);
  }, [lastClaimTime]);

  const handleClaim = async () => {
    if (!canClaim || !userId) return;
    
    try {
      console.log("Attempting to claim reward for user:", userId);
      const now = new Date();
      
      // 통합된 유틸리티 함수 사용
      const updatedUser = await updateUserDocument(userId, {
        points: userPoints + dailyAmount,
        lastClaimTime: now
      });
      
      if (updatedUser) {
        console.log("Claim successful!");
        setUserPoints(updatedUser.points);
        setLastClaimTime(updatedUser.lastClaimTime?.toDate() || now);
        setCanClaim(false);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert(`클레임 처리 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 사용자 ID가 없는 경우 텔레그램으로 로그인 필요 메시지 표시
  if (!userId) {
    return (
      <div className="daily-claim-container">
        <div className="claim-section">
          <h2>텔레그램 로그인이 필요합니다</h2>
          <p>일일 보상을 받으려면 텔레그램으로 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="daily-claim-container">
        <div className="claim-section">
          <h2>로딩 중...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-claim-container">
      <div className="points-display">
        <span className="points-label">CCGG</span>
        <span className="points-value">{userPoints} <span className="mopi-icon">MOPI</span></span>
      </div>
      
      <div className="claim-section">
        {canClaim ? (
          <>
            <h2 className="claim-title">DAILY CLAIM:</h2>
            <p className="claim-amount">{dailyAmount}</p>
            <div className="logo-container">
              <img src={ccggLogo}
                alt="CCGG Logo"
                className="claim-logo" 
              />
            </div>
            <button className="claim-button" onClick={handleClaim}>CLAIM</button>
          </>
        ) : (
          <>
            <h2 className="claim-title">NEXT CLAIM:</h2>
            <ClaimTimer timeRemaining={timeRemaining} />
            <div className="logo-container">
              <img src={ccggLogo}
                alt="CCGG Logo"
                className="claim-logo" 
              />
            </div>
            <button className="claimed-button" disabled>CLAIMED</button>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyClaim;