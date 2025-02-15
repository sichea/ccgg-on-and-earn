'use client';

import React, { useState } from 'react';
import { Copy, Users, Clock, Award } from 'lucide-react';

interface ReferralHistory {
  id: string;
  friendName: string;
  date: string;
  pointsEarned: number;
}

const FriendsPage = () => {
  const [referralLink] = useState('https://t.me/ccgguild?start=ref_123456');
  const [totalEarned, setTotalEarned] = useState(2500);
  const [referralCount, setReferralCount] = useState(5);
  
  const [history] = useState<ReferralHistory[]>([
    {
      id: '1',
      friendName: 'User123',
      date: '2024.02.16',
      pointsEarned: 500
    },
    {
      id: '2',
      friendName: 'Crypto789',
      date: '2024.02.15',
      pointsEarned: 500
    },
    {
      id: '3',
      friendName: 'Web3Guy',
      date: '2024.02.14',
      pointsEarned: 500
    }
  ]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('추천 링크가 복사되었습니다!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4 pb-20">
      {/* 헤더 */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="text-2xl font-bold">Friends</div>
        <div className="bg-gray-800 px-4 py-2 rounded-lg flex items-center">
          <Users className="mr-2" size={20} />
          <span>{referralCount}</span>
        </div>
      </div>

      {/* 추천 보상 안내 */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-2">친구 추천하고 포인트 받기</h2>
        <div className="text-gray-400 mb-4">
          친구 한 명당 500 포인트를 받을 수 있습니다!
        </div>
        <div className="bg-gray-700 rounded-lg p-4 flex justify-between items-center mb-4">
          <div className="text-sm">내 추천 링크</div>
          <button 
            onClick={() => copyToClipboard(referralLink)}
            className="flex items-center text-yellow-400 hover:text-yellow-500"
          >
            <Copy className="mr-1" size={16} />
            복사하기
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">총 획득한 포인트</span>
          <span className="text-yellow-400 font-bold">
            {totalEarned.toLocaleString()} 💎
          </span>
        </div>
      </div>

      {/* 추천 보상 내역 */}
      <div className="flex items-center mb-4">
        <Clock className="mr-2" size={20} />
        <h2 className="text-lg font-semibold">친구 추천 내역</h2>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="bg-gray-800 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <div className="text-sm text-gray-400">{item.date}</div>
              <div className="mt-1">{item.friendName} 가입</div>
            </div>
            <div className="flex items-center text-yellow-400 font-semibold">
              <span>+{item.pointsEarned.toLocaleString()}</span>
              <span className="ml-1">💎</span>
            </div>
          </div>
        ))}
      </div>

      {/* 추천 프로그램 규칙 */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Award className="mr-2" size={20} />
          <h3 className="font-semibold">추천 프로그램 규칙</h3>
        </div>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• 친구가 추천 링크로 가입하면 500 포인트를 받습니다.</li>
          <li>• 추천 받은 친구도 200 포인트를 받습니다.</li>
          <li>• 한 사람당 최대 50명까지 추천할 수 있습니다.</li>
          <li>• 부정 추천 시 포인트가 회수될 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default FriendsPage;