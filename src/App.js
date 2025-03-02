// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavigationBar from './components/layout/NavigationBar';
import AppRoutes from './routes';
import './styles/global.css';

function App() {
  const [telegramUser, setTelegramUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 텔레그램 WebApp 초기화
  useEffect(() => {
    // WebApp이 이미 로드되어 있는지 확인
    if (window.Telegram && window.Telegram.WebApp) {
      initTelegramApp();
    } else {
      // 텔레그램 WebApp 스크립트 로드
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;
      script.onload = initTelegramApp;
      document.body.appendChild(script);

      return () => {
        if (script.parentNode) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  // 텔레그램 앱 초기화 함수
  const initTelegramApp = () => {
    try {
      const tgApp = window.Telegram && window.Telegram.WebApp;
      if (tgApp) {
        tgApp.ready();
        tgApp.expand();

        // 사용자 정보 가져오기
        if (tgApp.initDataUnsafe && tgApp.initDataUnsafe.user) {
          const user = tgApp.initDataUnsafe.user;
          setTelegramUser(user);
          
          // 관리자 확인
          const adminIds = ['5172197798', 'ADMIN_TELEGRAM_ID_2']; 
          setIsAdmin(adminIds.includes(String(user.id)));
        } else {
          // 개발 환경에서 테스트용 모의 사용자 설정
          if (process.env.NODE_ENV === 'development') {
            const mockUser = {
              id: 12345678,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'ko'
            };
            setTelegramUser(mockUser);
            setIsAdmin(true); // 개발 환경에서는 관리자 권한 부여
          }
        }
      } else {
        // 개발 환경에서 모의 사용자 설정
        if (process.env.NODE_ENV === 'development') {
          const mockUser = {
            id: 12345678,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'ko'
          };
          setTelegramUser(mockUser);
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error('텔레그램 WebApp 초기화 오류:', error);
      // 개발 환경에서 오류 시 모의 사용자 설정
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: 12345678,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'ko'
        };
        setTelegramUser(mockUser);
        setIsAdmin(true);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <Router>
      <div className="app">
        <div className="content-wrapper">
          {/* AppRoutes 컴포넌트로 라우트 관리 */}
          <AppRoutes telegramUser={telegramUser} isAdmin={isAdmin} />
        </div>
        {/* 네비게이션 바 */}
        <NavigationBar />
      </div>
    </Router>
  );
}

export default App;