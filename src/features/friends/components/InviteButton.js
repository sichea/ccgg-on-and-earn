// src/features/friends/components/InviteButton.js 수정
import React, { useState } from 'react';
import { doc, updateDoc, increment, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const InviteButton = ({ telegramUser }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleInviteFriend = async () => {
    try {
      setIsCreating(true);
      
      if (!telegramUser?.id) {
        alert('사용자 정보를 찾을 수 없습니다.');
        setIsCreating(false);
        return;
      }
      
      const userId = telegramUser.id.toString();
      
      // 봇 이름 가져오기
      const botName = process.env.REACT_APP_TELEGRAM_BOT_NAME || 'CCGGMingBot';
      
      // 더 단순한 초대 링크 생성 (직접 사용자 ID 전달)
      const inviteLink = `https://t.me/${botName}?start=invite_${userId}`;
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(inviteLink);
      
      console.log(`초대 링크 생성 완료: ${inviteLink}`);
      alert('초대 링크가 복사되었습니다! 친구에게 공유하세요.');
      setCopySuccess(true);
      
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