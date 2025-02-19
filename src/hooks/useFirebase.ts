// src/hooks/useFirebase.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  where,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TaskFormData } from '@/types/task';


interface Task {
  id: string;
  title: string;
  category: 'CCGG' | 'IP Productions';
  platform: 'twitter' | 'discord' | 'telegram' | 'other';
  link?: string;
  reward: {
    points: number;
    coins: number;
  };
  action: 'Visit' | 'Join' | 'Follow' | 'Fly' | 'Claim';
  createdAt: Date;
}

interface User {
  id: string;
  telegramId: string;
  points: number;
  coins: number;
  lastClaim?: Date;
  referredBy?: string;
  referralCount: number;
}

// Tasks 관련 훅
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const tasksCollection = collection(db, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const tasksList = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Task));
      setTasks(tasksList);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (taskData: TaskFormData) => {
    try {
      const tasksCollection = collection(db, 'tasks');
      return await addDoc(tasksCollection, {
        ...taskData,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, taskData: TaskFormData) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, taskData);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  return { tasks, loading, addTask, deleteTask, updateTask }; // updateTask 추가
};

// User 관련 훅
export const useUser = (telegramId: string | undefined) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!telegramId) {
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('telegramId', '==', telegramId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUser({
            id: querySnapshot.docs[0].id,
            ...userData,
          } as User);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [telegramId]);

  const updatePoints = async (points: number) => {
    if (!user?.id) return;

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        points: (user.points || 0) + points
      });
      
      // 로컬 상태 업데이트
      setUser(prev => prev ? {
        ...prev,
        points: (prev.points || 0) + points
      } : null);
    } catch (error) {
      console.error('Error updating points:', error);
      throw error;
    }
  };

  return { user, loading, updatePoints };
};