// src/types/point.ts
export type PointTransactionType = 'EARN' | 'USE' | 'REFERRAL' | 'TASK_COMPLETE';

export interface PointTransaction {
  id: string;
  userId: string;
  type: PointTransactionType;
  amount: number;
  description: string;
  createdAt: Date;
  metadata?: {
    taskId?: string;
    referralId?: string;
    [key: string]: any;
  };
}

export interface UserPoints {
  total: number;
  lastUpdated: Date;
}