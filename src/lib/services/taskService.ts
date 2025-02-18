// src/lib/services/taskService.ts
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Task {
  id: string;
  title: string;
  description: string;
  link?: string;
  reward: {
    points: number;
    coins: number;
  };
  platform: 'twitter' | 'discord' | 'telegram' | 'other';
  action: 'Visit' | 'Join' | 'Follow' | 'Fly' | 'Claim';
  category: 'CCGG' | 'IP Productions';
  isActive: boolean;
  createdAt: Date;
}

export interface CompletedTask {
  id?: string;
  userId: string;
  taskId: string;
  completedAt: Date;
  pointsEarned: number;
  coinsEarned: number;
  taskTitle: string;
  platform: string;
  category: string;
}

class TaskService {
  // 활성화된 태스크 목록 조회
  async getActiveTasks() {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
  }

  // 특정 사용자의 완료된 태스크 목록 조회
  async getUserCompletedTasks(userId: string) {
    const completedTasksRef = collection(db, 'completedTasks');
    const q = query(completedTasksRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CompletedTask[];
  }

  // 태스크 완료 처리
  async completeTask(userId: string, taskId: string) {
    try {
      // 1. 태스크 정보 조회
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) {
        return { success: false, message: '존재하지 않는 태스크입니다.' };
      }

      const task = taskSnap.data() as Task;
      if (!task.isActive) {
        return { success: false, message: '비활성화된 태스크입니다.' };
      }

      // 2. 이미 완료한 태스크인지 확인
      const completedTasksRef = collection(db, 'completedTasks');
      const q = query(
        completedTasksRef,
        where('userId', '==', userId),
        where('taskId', '==', taskId)
      );
      const completedSnapshot = await getDocs(q);

      if (!completedSnapshot.empty) {
        return { success: false, message: '이미 완료한 태스크입니다.' };
      }

      // 3. 완료 정보 저장
      const completedTaskRef = doc(completedTasksRef);
      await setDoc(completedTaskRef, {
        userId,
        taskId,
        completedAt: serverTimestamp(),
        pointsEarned: task.reward.points,
        coinsEarned: task.reward.coins,
        taskTitle: task.title,
        platform: task.platform,
        category: task.category
      });

      // 4. 사용자 포인트/코인 업데이트
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        points: task.reward.points,
        coins: task.reward.coins,
        lastPointsUpdate: serverTimestamp()
      });

      return { 
        success: true,
        message: `태스크 완료! ${task.reward.points} 포인트와 ${task.reward.coins} 코인이 지급되었습니다.`
      };
    } catch (error) {
      console.error('태스크 완료 처리 실패:', error);
      return { success: false, message: '태스크 완료 처리에 실패했습니다.' };
    }
  }

  // 새 태스크 생성
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'isActive'>) {
    const tasksRef = collection(db, 'tasks');
    const newTaskRef = doc(tasksRef);
    
    await setDoc(newTaskRef, {
      ...taskData,
      isActive: true,
      createdAt: serverTimestamp()
    });

    return newTaskRef.id;
  }

  // 태스크 수정
  async updateTask(taskId: string, updates: Partial<Omit<Task, 'id'>>) {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }
}

export const taskService = new TaskService();