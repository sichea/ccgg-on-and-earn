import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });

export async function POST(req: Request) {
  try {
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Telegram API error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}