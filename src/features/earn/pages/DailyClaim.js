// src/features/earn/pages/DailyClaim.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import ClaimTimer from '../components/ClaimTimer';
import { getUserDocument, updateUserDocument, resetAdViewCountIfNeeded, processAdReward } from '../../../utils/userUtils';
import { initAdsgram, showRewardedAd, checkAdAvailability } from '../../../services/adsgramService';
import '../styles/EarnStyles.css';
import ccggLogo from "../../../assets/images/ccgg-logo.png";

const DailyClaim = ({ telegramUser, isAdmin }) => {
  const [userPoints, setUserPoints] = useState(0);
  const [dailyAmount, setDailyAmount] = useState(10);
  const [lastClaimTime, setLastClaimTime] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [userId, setUserId] = useState(telegramUser?.id?.toString() || null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 광고 관련 상태
  const [adViewCount, setAdViewCount] = useState(0);
  const [maxAdViews, setMaxAdViews] = useState(10);
  const [isAdAvailable, setIsAdAvailable] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adsInitialized, setAdsInitialized] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false); // 광고 시청 완료 상태
  
  // telegramUser 변경시 userId 업데이트
  useEffect(() => {
    if (telegramUser && telegramUser.id) {
      setUserId(telegramUser.id.toString());
    }
  }, [telegramUser]);
  
  // adsgram SDK 초기화
  useEffect(() => {
    const initializeAds = async () => {
      try {
        await initAdsgram();
        setAdsInitialized(true);
        
        const available = await checkAdAvailability();
        setIsAdAvailable(available);
      } catch (error) {
        console.error('광고 SDK 초기화 오류:', error);
      }
    };
    
    if (!adsInitialized) {
      initializeAds();
    }
  }, [adsInitialized]);
  
  // 사용자 데이터 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !telegramUser) return;
      
      setIsLoading(true);
      try {
        // 사용자 정보 가져오기
        const userData = await getUserDocument(telegramUser);
        
        if (userData) {
          setUserPoints(userData.points || 0);
          setLastClaimTime(userData.lastClaimTime?.toDate() || null);
          
          // 광고 관련 데이터 처리
          const resetData = await resetAdViewCountIfNeeded(userId);
          if (resetData) {
            setAdViewCount(resetData.adViewCount || 0);
          } else {
            setAdViewCount(userData.adViewCount || 0);
          }
        }
        
        // 보상 관련 설정 불러오기
        const settingsRef = doc(db, 'settings', 'dailyRewards');
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          setDailyAmount(settingsDoc.data().amount || 10);
          setMaxAdViews(settingsDoc.data().maxAdViews || 10);
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
  
  // 일반 클레임 가능 여부 확인
  useEffect(() => {
    const checkClaimEligibility = () => {
      if (!lastClaimTime) {
        setCanClaim(true);
        setTimeRemaining(null);
        return;
      }

      const now = new Date();
      const timeDiff = now - lastClaimTime;
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
  
  // 광고 가용성 주기적 체크
  useEffect(() => {
    if (!adsInitialized) return;
    
    const checkAds = async () => {
      const available = await checkAdAvailability();
      setIsAdAvailable(available);
    };
    
    checkAds();
    const adCheckInterval = setInterval(checkAds, 60000); // 1분마다 확인
    
    return () => clearInterval(adCheckInterval);
  }, [adsInitialized]);
  
  // 일반 클레임 핸들러
  const handleClaim = async () => {
    if (!canClaim || !userId) return;
    
    try {
      console.log("Attempting to claim reward for user:", userId);
      const now = new Date();
      
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
  
  // 광고 시청 핸들러
  const handleWatchAd = async () => {
    if (isWatchingAd || adViewCount >= maxAdViews) return;
    
    setIsWatchingAd(true);
    setAdCompleted(false);
    
    try {
      // 광고 표시
      const adResult = await showRewardedAd();
      
      if (adResult.success) {
        console.log('광고 시청 완료, 보상 버튼 활성화');
        setAdCompleted(true);
      }
    } catch (error) {
      console.error('광고 시청 오류:', error);
      alert('광고 시청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsWatchingAd(false);
      
      // 광고 가용성 다시 확인
      const available = await checkAdAvailability();
      setIsAdAvailable(available);
    }
  };
  
  // 광고 보상 수령 핸들러
  const handleClaimAdReward = async () => {
    if (!adCompleted || !userId) return;
    
    try {
      const result = await processAdReward(userId);
      
      if (result.success) {
        setUserPoints(prev => prev + 10); // 10 CGP 보상
        setAdViewCount(prev => prev + 1);
        setAdCompleted(false);
        alert(`${result.message}`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('보상 처리 오류:', error);
      alert('보상 처리 중 오류가 발생했습니다.');
    }
  };
  
  // 사용자 ID가 없는 경우
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

  // 로딩 중
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
        <span className="points-value">{userPoints} <span className="mopi-icon">CGP</span></span>
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
        
        {/* 광고 시청 섹션 */}
        <div className="ad-section">
          <h3 className="ad-title">광고 시청으로 더 많은 CGP 획득하기</h3>
          <p className="ad-info">
            오늘 {adViewCount}/{maxAdViews} 광고 시청 완료
          </p>
          <div className="ad-progress-bar">
            <div 
              className="ad-progress-fill"
              style={{ width: `${(adViewCount / maxAdViews) * 100}%` }}
            ></div>
          </div>
          
          {adCompleted ? (
            // 광고 시청 완료 시 보상 버튼 표시
            <button
              onClick={handleClaimAdReward}
              className="claim-button"
            >
              보상 받기 (10 CGP)
            </button>
          ) : (
            // 광고 시청 버튼
            <button
              className={`ad-button ${(!isAdAvailable || adViewCount >= maxAdViews || isWatchingAd) ? 'disabled' : ''}`}
              onClick={handleWatchAd}
              disabled={!isAdAvailable || adViewCount >= maxAdViews || isWatchingAd}
            >
              {isWatchingAd 
                ? '광고 로딩 중...' 
                : adViewCount >= maxAdViews 
                  ? '오늘 최대 시청 횟수 도달' 
                  : !isAdAvailable
                    ? '현재 광고를 불러올 수 없습니다'
                    : '광고 보고 CGP 받기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyClaim;