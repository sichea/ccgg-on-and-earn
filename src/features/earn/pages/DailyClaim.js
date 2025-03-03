import React, { useState, useEffect } from 'react';
import { db } from '../../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import DailyClaimButton from '../components/DailyClaimButton';
import ClaimTimer from '../components/ClaimTimer';
import '../styles/EarnStyles.css';

const DailyClaim = ({ telegramUser, isAdmin }) => {
  const [userPoints, setUserPoints] = useState(0);
  const [dailyAmount, setDailyAmount] = useState(1000);
  const [lastClaimTime, setLastClaimTime] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  // userId를 텔레그램 사용자 ID로 설정
  const [userId, setUserId] = useState(telegramUser?.id?.toString() || null);

  useEffect(() => {
    // telegramUser가 변경될 때 userId 업데이트
    if (telegramUser && telegramUser.id) {
      setUserId(telegramUser.id.toString());
    }
  }, [telegramUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return; // userId가 없으면 함수 종료
      
      try {
        console.log("Fetching data for user:", userId);
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPoints(userData.points || 0);
          setLastClaimTime(userData.lastClaimTime?.toDate() || null);
          
          // 관리자 설정에서 일일 보상 금액 가져오기
          const settingsRef = doc(db, 'settings', 'dailyRewards');
          const settingsDoc = await getDoc(settingsRef);
          
          if (settingsDoc.exists()) {
            setDailyAmount(settingsDoc.data().amount || 1000);
          }
        } else {
          // 사용자 문서가 없으면 새로 만들기
          console.log("User document doesn't exist, creating new one");
          try {
            await updateDoc(userRef, {
              points: 0,
              lastClaimTime: null,
              createdAt: new Date(),
              telegramId: telegramUser?.id?.toString(),
              username: telegramUser?.username || null,
              firstName: telegramUser?.first_name || null,
              lastName: telegramUser?.last_name || null
            });
          } catch (error) {
            console.error("Error creating user document:", error);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
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
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        points: userPoints + dailyAmount,
        lastClaimTime: now
      });
      
      console.log("Claim successful!");
      setUserPoints(prev => prev + dailyAmount);
      setLastClaimTime(now);
      setCanClaim(false);
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
              <img 
                src="/images/ccgg-logo.png" 
                alt="MOPI" 
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
              <img 
                src="/images/ccgg-logo.png" 
                alt="MOPI" 
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