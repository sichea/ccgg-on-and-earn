// src/lib/firebase/utils.ts
import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  increment
} from 'firebase/firestore';
import type { User, Task, CompletedTask, PointTransaction } from './types';

// User Management
export async function createUser(telegramUser: any): Promise<User> {
  const userRef = doc(db, 'users', telegramUser.id.toString());
  const referralCode = generateReferralCode();

  const userData: User = {
    id: telegramUser.id.toString(),
    username: telegramUser.username,
    points: 0,
    referralCode,
    referralCount: 0,
    createdAt: Timestamp.now(),
  };

  await setDoc(userRef, userData);
  return userData;
}

export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return null;
  return userSnap.data() as User;
}

// Task Management
export async function getTasks(): Promise<Task[]> {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('isActive', '==', true));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Task[];
}

export async function completeTask(userId: string, taskId: string): Promise<boolean> {
  const taskRef = doc(db, 'tasks', taskId);
  const taskSnap = await getDoc(taskRef);
  
  if (!taskSnap.exists()) return false;
  
  const task = taskSnap.data() as Task;
  const completedTaskRef = doc(db, 'completedTasks', `${userId}_${taskId}`);
  const currentTime = Timestamp.now();
  
  try {
    // 완료 정보 저장
    const completedTask: CompletedTask = {
      userId,
      taskId,
      completedAt: currentTime,
      pointsEarned: task.points
    };
    await setDoc(completedTaskRef, completedTask);

    // 포인트 업데이트
    await updateDoc(doc(db, 'users', userId), {
      points: increment(task.points)
    });

    // 포인트 트랜잭션 기록
    const transaction: PointTransaction = {
      userId,
      amount: task.points,
      type: 'task',
      description: `Completed task: ${task.title}`,
      referenceId: taskId,
      createdAt: currentTime
    };
    await recordPointTransaction(transaction);

    return true;
  } catch (error) {
    console.error('Error completing task:', error);
    return false;
  }
}

// Daily Claim System
export async function claimDaily(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return false;
  
  const userData = userSnap.data() as User;
  const now = Timestamp.now();
  const lastClaim = userData.lastDailyClaim;
  
  if (lastClaim && isSameDay(lastClaim.toDate(), now.toDate())) {
    return false;
  }
  
  const dailyPoints = 100; // Configure as needed
  
  try {
    await updateDoc(userRef, {
      points: increment(dailyPoints),
      lastDailyClaim: now
    });

    await recordPointTransaction({
      userId,
      amount: dailyPoints,
      type: 'daily',
      description: 'Daily claim bonus',
      createdAt: now
    });

    return true;
  } catch (error) {
    console.error('Error claiming daily:', error);
    return false;
  }
}

// Point Transaction Helper
async function recordPointTransaction(transaction: PointTransaction): Promise<void> {
  const transactionRef = doc(collection(db, 'pointTransactions'));
  await setDoc(transactionRef, transaction);
}

// Utility Functions
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}