import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

// 텔레그램 봇 서버사이드에서만 초기화
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 텔레그램 봇 API 처리 로직
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}