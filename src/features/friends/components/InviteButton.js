import React from 'react';

const InviteButton = () => {
  // 텔레그램 웹앱 API를 통한 친구 초대 함수
  const handleInviteFriend = () => {
    // 텔레그램 WebApp API가 존재하는지 확인
    if (window.Telegram && window.Telegram.WebApp) {
      // 텔레그램의 사용자 선택기를 띄움
      window.Telegram.WebApp.openScanQrPopup({
        text: 'Scan this QR code to join our app!'
      });
    } else {
      alert('Telegram WebApp is not available');
    }
  };

  // 초대 링크 복사 함수
  const handleCopyLink = () => {
    // 사용자의 고유 초대 링크 생성 (실제로는 백엔드에서 생성해야 함)
    const inviteLink = `https://t.me/your_bot_name?start=invite_${Date.now()}`;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        alert('Invitation link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy link.');
      });
  };

  return (
    <>
      <button className="invite-button" onClick={handleInviteFriend}>
        <span>Invite a friend</span>
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