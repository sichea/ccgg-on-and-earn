import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavigationBar from './components/layout/NavigationBar';
import AppRoutes from './routes';
import './styles/global.css';
import { processInvitation } from './features/friends/utils/inviteCodeUtils';

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

  // 초대 코드 처리 함수 - startapp 파라미터가 있는 경우 바로 처리
  useEffect(() => {
    const checkStartAppParam = async () => {
      try {
        if (!telegramUser?.id) return;
        
        // startapp 파라미터 확인 (텔레그램에서 앱을 실행할 때 초대코드가 전달될 수 있음)
        const tgApp = window.Telegram && window.Telegram.WebApp;
        const startParam = tgApp?.initDataUnsafe?.start_param;
        
        console.log('시작 파라미터 확인:', startParam);
        
        if (!startParam) return;
        
        // 초대 코드로 처리
        if (startParam.length >= 10) { // 초대코드는 최소 10자리 이상으로 가정
          console.log('초대 코드 처리 시작:', startParam);
          
          const inviteeId = telegramUser.id.toString();
          
          // 초대 처리 함수 호출
          const result = await processInvitation(startParam, inviteeId);
          
          if (result.success) {
            console.log('초대 처리 성공:', result.message);
            // 성공 메시지를 사용자에게 보여줄 수 있음
            // alert(`${result.inviterName}님의 초대가 처리되었습니다! ${result.inviteeReward} MOPI를 받았습니다.`);
          } else {
            console.log('초대 처리 실패:', result.message);
          }
        }
      } catch (error) {
        console.error('초대 파라미터 처리 오류:', error);
      }
    };

    if (telegramUser) {
      checkStartAppParam();
    }
  }, [telegramUser]);

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
          const adminIds = ['5172197798', '5017989552']; 
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
    return <div className="loading text-white text-center p-4 bg-[#1c2333] min-h-screen flex justify-center items-center">로딩 중...</div>;
  }

  return (
    <Router>
      <div className="app bg-[#1c2333] min-h-screen text-white">
        <div className="content-wrapper pb-16"> {/* 네비게이션 바 공간 확보 */}
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