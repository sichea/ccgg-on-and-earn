// src/lib/firebase/types.ts
import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  username?: string;
  points: number;
  lastDailyClaim?: Timestamp;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'official' | 'partner';
  link: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompletedTask {
  userId: string;
  taskId: string;
  completedAt: Timestamp;
  pointsEarned: number;
}

export interface PointTransaction {
  userId: string;
  amount: number;
  type: 'task' | 'daily' | 'referral' | 'shop';
  description: string;
  createdAt: Timestamp;
  referenceId?: string;
}