import React from 'react';

const RewardInfo = ({ icon, text, hasInfoIcon }) => {
  return (
    <div className="reward-item">
      <div className="reward-icon">{icon}</div>
      <div className="reward-text">
        {text}
        {hasInfoIcon && <span className="info-icon">ⓘ</span>}
      </div>
    </div>
  );
};

export default RewardInfo;