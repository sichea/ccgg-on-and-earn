// types/task.ts

export type TaskStatus = 'active' | 'completed' | 'expired';

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  startDate: Date;
  endDate: Date;
  status: TaskStatus;
  requirements?: {
    type: 'telegram_join' | 'telegram_post' | 'external_link' | 'custom';
    data: {
      url?: string;
      channelUsername?: string;
      postId?: string;
      customData?: any;
    };
  };
  completionCriteria?: {
    type: 'automatic' | 'manual';
    verificationMethod?: 'screenshot' | 'link' | 'code';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTask extends Task {
  userId: string;
  completedAt?: Date;
  verificationData?: {
    screenshot?: string;
    link?: string;
    code?: string;
  };
}