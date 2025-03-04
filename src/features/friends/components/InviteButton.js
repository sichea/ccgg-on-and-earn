import React, { useState } from 'react';

const InviteButton = ({ telegramUser }) => {
  const [copySuccess, setCopySuccess] = useState(false);

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
    const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'CCGGMingBot';
    return `https://t.me/${botName}?start=invite_${inviteCode}`;
  };

  // 텔레그램 웹앱 API를 통한 친구 초대 함수 (링크 복사)
  const handleInviteFriend = () => {
    try {
      // 초대 링크 생성
      const inviteLink = generateInviteLink();
      
      // 클립보드에 복사
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          setCopySuccess(true);
          alert('초대 링크가 클립보드에 복사되었습니다!');
          
          // 3초 후 성공 메시지 초기화
          setTimeout(() => {
            setCopySuccess(false);
          }, 3000);
        })
        .catch(err => {
          console.error('링크 복사 실패: ', err);
          alert('링크 복사에 실패했습니다. 다시 시도해주세요.');
        });
    } catch (error) {
      console.error('초대 링크 생성 오류:', error);
      alert('초대 링크 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <button 
      className={`invite-button ${copySuccess ? 'success' : ''}`} 
      onClick={handleInviteFriend}
    >
      <span>{copySuccess ? '복사 완료!' : '친구 초대하기'}</span>
      <span style={{ marginLeft: '8px' }}>{copySuccess ? '✓' : '👤'}</span>
    </button>
  );
};

export default InviteButton;