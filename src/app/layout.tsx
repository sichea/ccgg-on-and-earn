// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'  // next/script 추가

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Event Game',
  description: 'Event participation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive" 
        />
        {children}
      </body>
    </html>
  )
}