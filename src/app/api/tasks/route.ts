// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/lib/services/taskService';
import { validateTelegramUser } from '@/lib/telegram/auth';
import { isAdminUser } from '@/config/admin';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-telegram-user-id');
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const tasks = await taskService.getActiveTasks();
    const completedTasks = await taskService.getUserCompletedTasks(userId);

    const completedTaskIds = new Set(completedTasks.map(task => task.taskId));
    const tasksWithStatus = tasks.map(task => ({
      ...task,
      isCompleted: completedTaskIds.has(task.id)
    }));

    return NextResponse.json({ tasks: tasksWithStatus });
  } catch (error) {
    console.error('태스크 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '태스크 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await validateTelegramUser(req);
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json(
        { error: '태스크 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await taskService.completeTask(user.uid, taskId);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('태스크 완료 처리 실패:', error);
    return NextResponse.json(
      { error: '태스크 완료 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}