// src/services/adsgramService.js
// adsgram AI 광고 서비스 통합 모듈

// adsgram 초기화 함수
export const initAdsgram = () => {
  // adsgram SDK 로드
  return new Promise((resolve, reject) => {
    try {
      if (window.adsgram) {
        console.log('Adsgram SDK already loaded');
        resolve(window.adsgram);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://api.adsgram.ai/sdk/v1.js';
      script.async = true;
      script.onload = () => {
        // SDK 로드 후 초기화
        window.adsgram.init({
          appId: process.env.REACT_APP_ADSGRAM_APP_ID || 'YOUR_ADSGRAM_APP_ID',
          debug: process.env.NODE_ENV === 'development'
        });
        
        console.log('Adsgram SDK loaded and initialized');
        resolve(window.adsgram);
      };
      script.onerror = (error) => {
        console.error('Failed to load Adsgram SDK:', error);
        reject(new Error('Failed to load Adsgram SDK'));
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.error('Adsgram initialization error:', error);
      reject(error);
    }
  });
};

// 리워드 광고 표시 함수
export const showRewardedAd = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.adsgram) {
        reject(new Error('Adsgram SDK not initialized'));
        return;
      }
      
      // 개발 모드에서는 가짜 광고 표시 (테스트용)
      if (process.env.NODE_ENV === 'development' && !window.adsgram.showRewardedAd) {
        console.log('Development mode: Simulating ad view');
        setTimeout(() => {
          resolve({ success: true });
        }, 1500);
        return;
      }
      
      // 광고 로드
      window.adsgram.loadRewardedAd({
        placementId: process.env.REACT_APP_ADSGRAM_PLACEMENT_ID || 'daily_claim_reward',
        onAdLoaded: () => {
          console.log('Rewarded ad loaded');
          
          // 광고 표시
          window.adsgram.showRewardedAd({
            onAdShown: () => {
              console.log('Rewarded ad shown');
            },
            onAdClosed: () => {
              console.log('Rewarded ad closed without completion');
              reject(new Error('Ad closed without completion'));
            },
            onAdCompleted: () => {
              console.log('Rewarded ad completed, allowing reward claim');
              resolve({ success: true });
            },
            onAdError: (error) => {
              console.error('Rewarded ad error:', error);
              reject(new Error(`Ad error: ${error}`));
            }
          });
        },
        onAdError: (error) => {
          console.error('Failed to load rewarded ad:', error);
          reject(new Error(`Failed to load ad: ${error}`));
        }
      });
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      reject(error);
    }
  });
};

// 광고 상태 확인 함수
export const checkAdAvailability = () => {
  return new Promise((resolve) => {
    if (!window.adsgram) {
      resolve(false);
      return;
    }
    
    // 개발 모드에서는 항상 광고 가능으로 처리 (테스트용)
    if (process.env.NODE_ENV === 'development' && !window.adsgram.isRewardedAdAvailable) {
      resolve(true);
      return;
    }
    
    const available = window.adsgram.isRewardedAdAvailable({
      placementId: process.env.REACT_APP_ADSGRAM_PLACEMENT_ID || 'daily_claim_reward'
    });
    
    resolve(available);
  });
};