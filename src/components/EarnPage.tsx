'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const EarnPage = () => {
  const [nextClaimTime, setNextClaimTime] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const DAILY_REWARD = 1000; // 하루 보상 포인트

  useEffect(() => {
    // 로컬 스토리지에서 마지막 클레임 시간 확인
    const lastClaimTime = localStorage.getItem('lastClaimTime');
    if (lastClaimTime) {
      const timeLeft = calculateTimeLeft(parseInt(lastClaimTime));
      setNextClaimTime(timeLeft);
      setCanClaim(timeLeft <= 0);
    } else {
      setCanClaim(true);
    }

    // 1초마다 남은 시간 업데이트
    const timer = setInterval(() => {
      if (lastClaimTime) {
        const timeLeft = calculateTimeLeft(parseInt(lastClaimTime));
        setNextClaimTime(timeLeft);
        setCanClaim(timeLeft <= 0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = (lastClaim: number): number => {
    const now = Date.now();
    const nextClaim = lastClaim + 24 * 60 * 60 * 1000; // 24시간
    return Math.max(0, nextClaim - now);
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClaim = () => {
    if (!canClaim) return;

    // 클레임 처리
    localStorage.setItem('lastClaimTime', Date.now().toString());
    setCanClaim(false);
    setNextClaimTime(24 * 60 * 60 * 1000); // 24시간

    // TODO: 포인트 지급 로직 추가
    console.log(`Claimed ${DAILY_REWARD} points`);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      {/* 상단 포인트 표시 */}
      <div className="w-full flex justify-between items-center mb-8 p-2">
        <div className="text-2xl font-bold">CCGG</div>
        <div className="bg-gray-800 px-4 py-2 rounded-lg flex items-center">
          <span className="mr-2">47,000</span>
          <span>💎</span>
        </div>
      </div>

      {/* 메인 클레임 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <div className="text-2xl font-bold mb-4">
          {canClaim ? 'DAILY CLAIM:' : 'NEXT CLAIM:'}
        </div>
        <div className="text-4xl font-bold mb-8 text-yellow-400">
          {canClaim ? DAILY_REWARD : formatTime(nextClaimTime || 0)}
        </div>

        {/* CCGG 로고 */}
        <div className="relative w-48 h-48 mb-8">
          <Image
            src="/ccgg-logo.png"
            alt="CCGG Logo"
            fill
            className={`rounded-full transition-all duration-300 ${canClaim ? 'cursor-pointer hover:scale-105' : 'opacity-50'}`}
            onClick={handleClaim}
          />
        </div>

        {/* 클레임 버튼 */}
        <button
          onClick={handleClaim}
          className={`px-8 py-3 rounded-lg text-lg font-bold transition-all duration-300 ${
            canClaim 
              ? 'bg-yellow-400 hover:bg-yellow-500 text-black' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!canClaim}
        >
          {canClaim ? 'CLAIM' : 'CLAIMED'}
        </button>
      </div>
    </div>
  );
};

export default EarnPage;