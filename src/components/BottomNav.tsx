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
    { href: '/', icon: null, label: 'Home' },
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/ranking', icon: Trophy, label: 'Ranking' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f1012] border-t border-gray-800 z-50">
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const active = isActive(item.href);
          
          // 중앙 로고
          if (item.href === '/') {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-[#0f1012] rounded-full flex items-center justify-center overflow-hidden border-4 border-[#0f1012] -mt-8">
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
            );
          }

          // 일반 네비게이션 아이템
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex flex-col items-center justify-center py-2"
            >
              <Icon className={`w-6 h-6 ${active ? 'text-yellow-400' : 'text-gray-400'}`} />
              <span className={`text-xs mt-1 ${active ? 'text-yellow-400' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;