// src/app/api/points/route.ts
import { NextResponse } from 'next/server';
import { PointService } from '@/lib/services/pointService';
import { validateInitData } from '@/lib/telegram';

export async function GET(request: Request) {
  try {
    const initData = request.headers.get('x-telegram-init-data');
    if (!initData) {
      return NextResponse.json({ error: 'No init data provided' }, { status: 401 });
    }

    const validatedData = validateInitData(initData);
    if (!validatedData?.user?.id) {
      return NextResponse.json({ error: 'Invalid init data' }, { status: 401 });
    }

    const userId = validatedData.user.id.toString();
    const points = await PointService.getPoints(userId);

    return NextResponse.json({ points });
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const initData = request.headers.get('x-telegram-init-data');
    if (!initData) {
      return NextResponse.json({ error: 'No init data provided' }, { status: 401 });
    }

    const validatedData = validateInitData(initData);
    if (!validatedData?.user?.id) {
      return NextResponse.json({ error: 'Invalid init data' }, { status: 401 });
    }

    const { amount, type, description, metadata } = await request.json();
    const userId = validatedData.user.id.toString();

    await PointService.addPoints(userId, amount, type, description, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding points:', error);
    return NextResponse.json({ error: 'Failed to add points' }, { status: 500 });
  }
}