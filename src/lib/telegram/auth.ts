// src/lib/telegram/auth.ts
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';

interface TelegramUser {
  uid: string;  // Telegram user ID as string
  firstName: string;
  lastName?: string;
  username?: string;
}

// Telegram 데이터 해시 검증
function validateHash(initData: string, botToken: string): boolean {
  const secret = createHash('sha256')
    .update(botToken)
    .digest();

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const hmac = createHash('sha256')
    .update(dataCheckString)
    .digest('hex');

  return hmac === hash;
}

export async function validateTelegramUser(request: NextRequest): Promise<TelegramUser | null> {
  try {
    // 1. initData 가져오기
    const initData = request.headers.get('x-telegram-init-data');
    if (!initData) {
      console.error('No Telegram init data found');
      return null;
    }

    // 2. BOT_TOKEN 환경변수 확인
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return null;
    }

    // 3. 해시 검증
    if (!validateHash(initData, botToken)) {
      console.error('Invalid Telegram hash');
      return null;
    }

    // 4. 사용자 데이터 파싱
    const urlParams = new URLSearchParams(initData);
    const userDataStr = urlParams.get('user');
    
    if (!userDataStr) {
      console.error('No user data found in Telegram init data');
      return null;
    }

    const userData = JSON.parse(userDataStr);

    // 5. 사용자 객체 반환
    return {
      uid: userData.id.toString(),
      firstName: userData.first_name,
      lastName: userData.last_name,
      username: userData.username
    };
  } catch (error) {
    console.error('Error validating Telegram user:', error);
    return null;
  }
}