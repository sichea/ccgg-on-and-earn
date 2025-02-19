'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ListTodo, 
  Ticket, 
  Users, 
  Coins,
  Wallet
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const BottomNav = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const navItems: NavItem[] = [
    { href: '/tasks', icon: ListTodo, label: 'Task' },
    { href: '/raffle', icon: Ticket, label: 'Raffle' },
    { href: '/earn', icon: Coins, label: 'Earn' },
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/wallet', icon: Wallet, label: 'Wallet' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f1012] border-t border-gray-800 z-50">
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const active = isActive(item.href);
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