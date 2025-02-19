'use client';

import { useEffect } from 'react';
import { initTelegramWebApp } from '@/lib/telegram';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 텔레그램 웹앱 초기화
    const webapp = initTelegramWebApp();
    
    if (webapp) {
      // 웹앱이 정상적으로 초기화되면 tasks 페이지로 이동
      router.push('/tasks');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-3xl font-bold mb-4">CCGG On & Earn</h1>
        <p className="text-gray-400">로딩중...</p>
      </div>
    </div>
  );
}