// src/features/friends/components/InviteButton.js
import React, { useState } from 'react';

const InviteButton = ({ telegramUser }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 초대 링크 생성 및 복사 함수
  const handleInviteFriend = async () => {
    try {
      setIsCreating(true);
      
      // 텔레그램 사용자 정보 확인
      if (!telegramUser?.id) {
        alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        setIsCreating(false);
        return;
      }
      
      // 사용자 ID를 문자열로 확실히 변환
      const userId = telegramUser.id.toString();
      
      // 봇 이름 가져오기
      const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'CCGGMingBot';
      
      // startapp 파라미터를 사용한 초대 링크 생성
      const inviteLink = `https://t.me/${botName}/game?startapp=${userId}`;
      console.log(`생성된 초대 링크: ${inviteLink}`);
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(inviteLink);
      
      // 성공 메시지 표시
      setCopySuccess(true);
      alert('초대 링크가 클립보드에 복사되었습니다!');
      
      // 3초 후 성공 메시지 초기화
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch (error) {
      console.error('초대 링크 생성 오류:', error);
      alert('초대 링크 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button 
      className={`invite-button ${copySuccess ? 'success' : ''}`} 
      onClick={handleInviteFriend}
      disabled={isCreating}
    >
      {isCreating ? (
        <span>생성 중...</span>
      ) : copySuccess ? (
        <>
          <span>복사 완료!</span>
          <span style={{ marginLeft: '8px' }}>✓</span>
        </>
      ) : (
        <>
          <span>친구 초대하기</span>
          <span style={{ marginLeft: '8px' }}>👤</span>
        </>
      )}
    </button>
  );
};

export default InviteButton;