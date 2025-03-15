// src/services/adsgramService.js
// adsgram AI 광고 서비스 통합 모듈

// Adsgram 컨트롤러 참조 (전역 상태)
let AdController = null;

// adsgram 초기화 함수
export const initAdsgram = () => {
  return new Promise((resolve, reject) => {
    try {
      if (window.Adsgram) {
        console.log('Adsgram SDK already loaded');
        if (!AdController) {
          AdController = window.Adsgram.init({
            blockId: process.env.REACT_APP_ADSGRAM_APP_ID || "7206" 
          });
        }
        resolve(AdController);
        return;
      }
      
      // 스크립트 로드
      const script = document.createElement('script');
      script.src = 'https://sad.adsgram.ai/js/sad.min.js';
      script.async = true;
      script.onload = () => {
        try {
          AdController = window.Adsgram.init({
            blockId: process.env.REACT_APP_ADSGRAM_APP_ID || "7206"
          });
          
          console.log('Adsgram SDK loaded and initialized');
          resolve(AdController);
        } catch (initError) {
          console.error('Adsgram initialization error:', initError);
          reject(initError);
        }
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

// 광고 표시 함수 - 공식 문서 방식으로 수정
export const showRewardedAd = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!AdController && window.Adsgram) {
        AdController = window.Adsgram.init({
          blockId: process.env.REACT_APP_ADSGRAM_APP_ID || "7206"
        });
      }
      
      if (!AdController) {
        reject(new Error('Adsgram SDK not initialized'));
        return;
      }
      
      // 공식 문서에 따라 show() 메서드 사용
      AdController.show()
        .then(() => {
          console.log('Ad shown and completed successfully');
          resolve({ success: true });
        })
        .catch((result) => {
          console.error('Ad error:', result);
          reject(result);
        });
    } catch (error) {
      console.error('Error showing ad:', error);
      reject(error);
    }
  });
};

// 광고 가용성 확인 - SDK가 로드되었는지만 확인
export const checkAdAvailability = () => {
  return new Promise((resolve) => {
    // SDK가 초기화되었는지만 확인
    if (AdController || window.Adsgram) {
      console.log('Adsgram SDK initialized, ads should be available');
      resolve(true);
    } else {
      console.log('Adsgram SDK not initialized');
      resolve(false);
    }
  });
};