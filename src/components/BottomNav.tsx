'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  ListTodo, 
  Ticket, 
  Users, 
  Trophy
} from 'lucide-react';

const BottomNav = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/tasks', icon: ListTodo, label: 'Task' },
    { href: '/raffle', icon: Ticket, label: 'Raffle' },
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/ranking', icon: Trophy, label: 'Ranking' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* 중앙 CCGG 로고 - 네비게이션 위에 위치 */}
      <Link href="/" className="absolute left-1/2 -translate-x-1/2 -translate-y-6 z-10">
        <div className="w-16 h-16 bg-[#0f1012] rounded-full flex items-center justify-center overflow-hidden border-4 border-[#0f1012]">
          <Image
            src="/ccgg-logo.png"
            alt="CCGG Logo"
            width={56}
            height={56}
            className="rounded-full"
            priority
          />
        </div>
      </Link>

      {/* 네비게이션 바 */}
      <nav className="bg-[#0f1012] border-t border-gray-800 relative">
        <div className="flex items-center justify-between px-4 py-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            // 중앙 공간 생성
            if (index === 2) {
              return (
                <React.Fragment key={item.href}>
                  <div className="w-16" /> {/* 로고를 위한 공간 */}
                  <Link href={item.href} className="flex flex-col items-center">
                    <Icon className={`w-6 h-6 ${active ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <span className={`text-xs mt-1 ${active ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                  </Link>
                </React.Fragment>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center">
                <Icon className={`w-6 h-6 ${active ? 'text-yellow-400' : 'text-gray-400'}`} />
                <span className={`text-xs mt-1 ${active ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;