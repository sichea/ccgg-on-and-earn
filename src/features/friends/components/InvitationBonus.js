import React from 'react';

const InvitationBonus = ({ bonus = 0 }) => {
  // bonus가 비정상적인 값인 경우 0으로 처리
  const bonusValue = isNaN(bonus) ? 0 : bonus;
  
  return (
    <div className="invitation-bonus-container">
      <div className="invitation-bonus-title">My Invitation bonus</div>
      <div className="invitation-bonus-value">
        <span className="invitation-bonus-coin">🪙</span>
        <span>{bonusValue}</span>
      </div>
    </div>
  );
};

export default InvitationBonus;