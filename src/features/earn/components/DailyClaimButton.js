import React from 'react';

const DailyClaimButton = ({ onClick }) => {
  return (
    <button className="claim-button" onClick={onClick}>
      CLAIM
    </button>
  );
};

export default DailyClaimButton;