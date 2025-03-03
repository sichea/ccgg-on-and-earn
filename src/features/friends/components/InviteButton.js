import React from 'react';

const InviteButton = ({ telegramUser }) => {
  // 초대 코드 생성 함수
  const generateInviteCode = (userId) => {
    // 사용자 ID와 타임스탬프를 조합하여 코드 생성
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${userId.substring(0, 6)}_${timestamp}_${randomStr}`;
  };

  // 초대 링크 생성 함수
  const generateInviteLink = () => {
    if (!telegramUser?.id) return "";
    
    const userId = telegramUser.id.toString();
    const inviteCode = generateInviteCode(userId);
    
    // 실제 봇 이름으로 변경해야 합니다 (예: 'your_money_toon_bot')
    const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'your_bot_name';
    return `https://t.me/${botName}?start=invite_${inviteCode}`;
  };

  // 텔레그램 웹앱 API를 통한 친구 초대 함수
  const handleInviteFriend = () => {
    try {
      // 초대 링크 생성
      const inviteLink = generateInviteLink();
      
      // 텔레그램 WebApp API가 존재하는지 확인
      if (window.Telegram && window.Telegram.WebApp) {
        // 공유 방법 1: 플랫폼에 따라 다른 메서드 사용
        if (window.Telegram.WebApp.showScanQrPopup) {
          // QR 코드 스캔 팝업 표시 (지원되는 플랫폼에서)
          window.Telegram.WebApp.showScanQrPopup({
            text: '이 QR 코드를 스캔하여 앱에 참여하세요!',
            callback: (text) => {
              console.log('QR 스캔 결과:', text);
            }
          });
        } else if (window.Telegram.WebApp.openTelegramLink) {
          // 텔레그램 링크 열기
          window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}`);
        } else {
          // 공유 방법 2: 클립보드에 복사하고 안내 메시지 표시
          navigator.clipboard.writeText(inviteLink)
            .then(() => {
              alert('초대 링크가 클립보드에 복사되었습니다! 친구에게 공유해주세요.');
            })
            .catch(err => {
              console.error('링크 복사 실패: ', err);
              alert('링크 복사에 실패했습니다.');
            });
        }
      } else {
        alert('텔레그램 앱에서만 초대 기능을 사용할 수 있습니다.');
      }
    } catch (error) {
      console.error('초대 링크 공유 오류:', error);
      
      // 문제 발생 시 대체 방법: 클립보드에 복사
      try {
        const inviteLink = generateInviteLink();
        navigator.clipboard.writeText(inviteLink)
          .then(() => {
            alert('초대 링크가 클립보드에 복사되었습니다! 친구에게 공유해주세요.');
          })
          .catch(err => {
            console.error('링크 복사 실패: ', err);
            alert('초대 기능에 문제가 발생했습니다. 복사 버튼을 사용해주세요.');
          });
      } catch (clipboardError) {
        alert('초대 기능에 문제가 발생했습니다. 복사 버튼을 사용해주세요.');
      }
    }
  };

  // 초대 링크 복사 함수
  const handleCopyLink = () => {
    try {
      // 초대 링크 생성
      const inviteLink = generateInviteLink();
      
      // 클립보드에 복사
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          alert('초대 링크가 클립보드에 복사되었습니다!');
        })
        .catch(err => {
          console.error('링크 복사 실패: ', err);
          alert('링크 복사에 실패했습니다.');
        });
    } catch (error) {
      console.error('초대 링크 생성 오류:', error);
      alert('초대 링크 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <button className="invite-button" onClick={handleInviteFriend}>
        <span>나의 친구 초대하기</span>
        <span style={{ marginLeft: '8px' }}>👤</span>
      </button>
      <button className="copy-link-button" onClick={handleCopyLink}>
        <svg className="copy-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V18M8 5C8 6.10457 8.89543 7 10 7H12C13.1046 7 14 6.10457 14 5M8 5C8 3.89543 8.89543 3 10 3H12C13.1046 3 14 3.89543 14 5M14 5H16C17.1046 5 18 5.89543 18 7V10M20 14H10M10 14L13 11M10 14L13 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </>
  );
};

export default InviteButton;