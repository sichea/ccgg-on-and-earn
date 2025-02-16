// src/config/telegram.ts
export const TELEGRAM_BOT_CONFIG = {
  botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  webAppUrl: `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}/app`
};