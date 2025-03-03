import React from 'react';

const InvitationBonus = ({ bonus }) => {
  return (
    <div className="invitation-bonus-container">
      <div className="invitation-bonus-title">My Invitation bonus</div>
      <div className="invitation-bonus-value">
        <span className="invitation-bonus-coin">🪙</span>
        <span>{bonus}</span>
      </div>
    </div>
  );
};

export default InvitationBonus;