'use client'; 
import { useEffect, ReactNode } from 'react';

interface TelegramThemeProviderProps {
  children: ReactNode;
}

export function TelegramThemeProvider({ children }: TelegramThemeProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // window.Telegram.WebApp 사용
      document.documentElement.style.setProperty(
        '--tg-theme-bg-color', 
        '#ffffff' // 기본값 설정
      );
      document.documentElement.style.setProperty(
        '--tg-theme-text-color', 
        '#000000' // 기본값 설정
      );
    }
  }, []);

  return <div className="bg-[var(--tg-theme-bg-color)]">{children}</div>;
}