'use client';

import React from 'react';
import { Clock, ShoppingBag } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
}

const WalletPage = () => {
  const balance = 48000;
  
  // 예시 적립 내역 데이터
  const historyItems: HistoryItem[] = [
    {
      id: '1',
      type: 'earn',
      amount: 1000,
      date: '2024.02.16',
      description: 'Daily Claim'
    },
    {
      id: '2',
      type: 'earn',
      amount: 100,
      date: '2024.02.16',
      description: 'CCGG 텔레그램 채널 구독'
    },
    {
      id: '3',
      type: 'earn',
      amount: 150,
      date: '2024.02.15',
      description: 'CCGG 디스코드 참여'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4 pb-20">
      {/* 헤더 */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="text-2xl font-bold">WALLET</div>
        <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center">
          <ShoppingBag className="mr-2" size={20} />
          Shop
        </button>
      </div>

      {/* 잔액 표시 */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="text-gray-400 text-sm mb-2">Total Balance</div>
        <div className="flex items-center text-3xl font-bold">
          <span className="mr-2">💎</span>
          <span>{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* 적립 내역 */}
      <div className="flex items-center mb-4">
        <Clock className="mr-2" size={20} />
        <h2 className="text-lg font-semibold">적립 내역</h2>
      </div>

      <div className="space-y-3">
        {historyItems.map((item) => (
          <div 
            key={item.id} 
            className="bg-gray-800 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <div className="text-sm text-gray-400">{item.date}</div>
              <div className="mt-1">{item.description}</div>
            </div>
            <div className="flex items-center text-yellow-400 font-semibold">
              <span>+{item.amount.toLocaleString()}</span>
              <span className="ml-1">💎</span>
            </div>
          </div>
        ))}
      </div>

      {/* Shop 준비중 모달 (클릭시 표시) */}
      <div className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
          <h3 className="text-xl font-bold mb-2">Shop Coming Soon!</h3>
          <p className="text-gray-400">
            Shop 기능은 곧 업데이트될 예정입니다. 조금만 기다려주세요!
          </p>
          <button className="mt-4 w-full bg-yellow-500 text-black py-2 rounded-lg">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;