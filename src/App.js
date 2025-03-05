// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavigationBar from './components/layout/NavigationBar';
import AppRoutes from './routes';
import './styles/global.css';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from './services/firebase';

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

  // 초대 코드 처리 함수
  useEffect(() => {
    const processInvitation = async () => {
      try {
        if (!telegramUser?.id) return;
        
        // start_param에서 초대 코드 확인
        const tgApp = window.Telegram && window.Telegram.WebApp;
        const startParam = tgApp?.initDataUnsafe?.start_param;
        
        console.log('초대 코드 확인:', startParam);
        
        if (!startParam) return;
        
        // 초대 코드 파싱
        let inviterId;
        if (startParam.startsWith('invite_')) {
          inviterId = startParam.replace('invite_', '');
        } else if (startParam.startsWith('direct_')) {
          inviterId = startParam.replace('direct_', '');
        } else if (startParam.split('_').length === 3) {
          // 이전 형식 (userId_timestamp_randomStr)
          inviterId = startParam.split('_')[0];
        } else {
          console.log('유효하지 않은 초대 코드 형식');
          return;
        }
        
        const inviteeId = telegramUser.id.toString();
        
        console.log(`초대 처리 시작: 초대자=${inviterId}, 초대받은사람=${inviteeId}`);
        
        // 자기 자신을 초대할 수 없음
        if (inviterId === inviteeId) {
          console.log('자기 자신을 초대할 수 없습니다.');
          return;
        }
        
        // 초대자 확인
        const inviterDocRef = doc(db, 'users', inviterId);
        const inviterDoc = await getDoc(inviterDocRef);
        
        if (!inviterDoc.exists()) {
          console.log('초대자를 찾을 수 없습니다.');
          return;
        }
        
        // 초대 받은 사용자 확인
        const inviteeDocRef = doc(db, 'users', inviteeId);
        const inviteeDoc = await getDoc(inviteeDocRef);
        
        if (inviteeDoc.exists() && inviteeDoc.data().invitedBy) {
          console.log('이미 초대된 사용자입니다.');
          return;
        }
        
        // 초대된 사용자 업데이트
        console.log('초대받은 사용자 문서 업데이트');
        await updateDoc(inviteeDocRef, {
          invitedBy: inviterId,
          invitedAt: new Date()
        });
        
        // 초대자 업데이트 - 직접 값을 계산하여 업데이트
        console.log('초대자 문서 업데이트 시작');
        
        // 초대자의 현재 데이터 가져오기
        const currentInviterData = inviterDoc.data();
        const currentBonus = currentInviterData.invitationBonus || 0;
        const currentCount = currentInviterData.invitationCount || 0;
        const currentPoints = currentInviterData.points || 0;
        const currentFriends = currentInviterData.friends || [];
        
        // 새 친구 정보
        const newFriend = {
          userId: inviteeId,
          username: inviteeDoc.exists() ? inviteeDoc.data().username : null,
          firstName: inviteeDoc.exists() ? inviteeDoc.data().firstName : null,
          lastName: inviteeDoc.exists() ? inviteeDoc.data().lastName : null,
          joinedAt: new Date().toISOString(),
          status: 'active'
        };
        
        // 이미 친구 목록에 있는지 확인
        const friendExists = currentFriends.some(friend => friend.userId === inviteeId);
        const updatedFriends = friendExists 
          ? currentFriends 
          : [...currentFriends, newFriend];
        
        // 명시적으로 값 설정하여 업데이트
        console.log('초대자 문서 업데이트 진행:', {
          newPoints: currentPoints + 1000,
          newBonus: currentBonus + 1000,
          newCount: currentCount + 1
        });
        
        await updateDoc(inviterDocRef, {
          points: currentPoints + 1000,
          invitationBonus: currentBonus + 1000,
          invitationCount: currentCount + 1,
          friends: updatedFriends,
          updatedAt: new Date()
        });
        
        console.log('초대 처리 완료!');
        
      } catch (error) {
        console.error('초대 처리 오류:', error);
      }
    };

    if (telegramUser) {
      processInvitation();
    }
  }, [telegramUser]); // telegramUser가 설정된 후에만 실행

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