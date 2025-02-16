// src/app/api/tasks/route.ts
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { NextResponse } from 'next/server';

// GET: 태스크 목록 조회
export async function GET() {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' }, 
      { status: 500 }
    );
  }
}

// POST: 태스크 완료 처리
export async function POST(request: Request) {
  try {
    const { userId, taskId } = await request.json();

    // 태스크 정보 조회
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    
    if (!taskSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = taskSnap.data();
    const currentTime = Timestamp.now();

    // 완료 정보 저장
    const completedTaskRef = doc(db, 'completedTasks', `${userId}_${taskId}`);
    await setDoc(completedTaskRef, {
      userId,
      taskId,
      completedAt: currentTime,
      pointsEarned: task.points
    });

    // 사용자 포인트 업데이트
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(task.points)
    });

    // 포인트 트랜잭션 기록
    const transactionRef = doc(collection(db, 'pointTransactions'));
    await setDoc(transactionRef, {
      userId,
      amount: task.points,
      type: 'task',
      description: `Completed task: ${task.title}`,
      referenceId: taskId,
      createdAt: currentTime
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Task completed successfully',
      pointsEarned: task.points
    });

  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete task' },
      { status: 500 }
    );
  }
}