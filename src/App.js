// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// 컴포넌트 임포트
import Home from './components/Home';
import EventDetail from './components/EventDetail';
import CreateEvent from './components/CreateEvent';
import './App.css';

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
        document.body.removeChild(script);
      };
    }
  }, []);

  // 텔레그램 앱 초기화 함수
  const initTelegramApp = () => {
    try {
      const tgApp = window.Telegram.WebApp;
      
      if (tgApp) {
        console.log('Telegram WebApp 초기화 시작');
        tgApp.ready();
        tgApp.expand();

        // 사용자 정보 가져오기
        if (tgApp.initDataUnsafe && tgApp.initDataUnsafe.user) {
          const user = tgApp.initDataUnsafe.user;
          console.log('텔레그램 사용자 정보 로드됨:', user);
          setTelegramUser(user);
          
          // 관리자 확인 (텔레그램 ID 기반)
          const adminIds = ['5172197798', 'ADMIN_TELEGRAM_ID_2']; // 관리자 텔레그램 ID 목록
          setIsAdmin(adminIds.includes(String(user.id)));
        } else {
          console.log('텔레그램 사용자 정보 없음, 개발 모드 확인');
          // 개발 환경에서 테스트용 모의 사용자 설정
          if (process.env.NODE_ENV === 'development') {
            const mockUser = {
              id: 12345678,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'ko'
            };
            console.log('개발 환경 모의 사용자 설정:', mockUser);
            setTelegramUser(mockUser);
            setIsAdmin(true); // 개발 환경에서는 관리자 권한 부여
          }
        }
      } else {
        console.warn('Telegram WebApp 객체를 찾을 수 없음');
        // 개발 환경에서 테스트용 모의 사용자 설정
        if (process.env.NODE_ENV === 'development') {
          const mockUser = {
            id: 12345678,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'ko'
          };
          console.log('개발 환경 모의 사용자 설정:', mockUser);
          setTelegramUser(mockUser);
          setIsAdmin(true); // 개발 환경에서는 관리자 권한 부여
        }
      }
    } catch (error) {
      console.error('텔레그램 WebApp 초기화 오류:', error);
      // 개발 환경에서 테스트용 모의 사용자 설정
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: 12345678,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'ko'
        };
        console.log('오류 후 개발 환경 모의 사용자 설정:', mockUser);
        setTelegramUser(mockUser);
        setIsAdmin(true); // 개발 환경에서는 관리자 권한 부여
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
        <Routes>
          <Route path="/" element={<Home telegramUser={telegramUser} isAdmin={isAdmin} />} />
          <Route path="/event/:id" element={<EventDetail telegramUser={telegramUser} isAdmin={isAdmin} />} />
          <Route path="/create" element={isAdmin ? <CreateEvent telegramUser={telegramUser} /> : <Home telegramUser={telegramUser} isAdmin={isAdmin} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;