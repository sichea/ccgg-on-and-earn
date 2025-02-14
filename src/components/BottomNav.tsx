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
    <nav className="fixed bottom-0 w-full bg-black border-t border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 relative">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          if (index === 1) {
            return (
              <React.Fragment key={item.href}>
                <Link href={item.href} className="flex flex-col items-center">
                  <Icon className={`w-6 h-6 ${active ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className={`text-xs mt-1 ${active ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </Link>
                {/* 중앙 CCGG 로고 */}
                <div className="relative -mt-8">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1">
                      <Image
                        src="/ccgg-logo.png"
                        alt="CCGG Logo"
                        width={60}
                        height={60}
                        priority
                      />
                    </div>
                  </div>
                </div>
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
  );
};

export default BottomNav;