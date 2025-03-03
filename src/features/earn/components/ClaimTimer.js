import React, { useState, useEffect } from 'react';

const ClaimTimer = ({ timeRemaining }) => {
  const [displayTime, setDisplayTime] = useState('24:00:00');

  useEffect(() => {
    if (!timeRemaining) {
      setDisplayTime('24:00:00');
      return;
    }

    const updateTimer = () => {
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      setDisplayTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(() => {
      if (timeRemaining <= 0) {
        clearInterval(interval);
        window.location.reload(); // 타이머 종료 후 페이지 리로드
      } else {
        updateTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  return <p className="claim-timer">{displayTime}</p>;
};

export default ClaimTimer;