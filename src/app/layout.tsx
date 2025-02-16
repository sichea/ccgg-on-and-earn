import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import { AuthProvider } from '@/contexts/AuthContext';
import { TelegramThemeProvider } from '@/components/telegram/TelegramThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Event Game',
  description: 'Event participation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <AuthProvider>
          <TelegramThemeProvider>
            <main className="pb-16">{children}</main>
            <BottomNav />
          </TelegramThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}