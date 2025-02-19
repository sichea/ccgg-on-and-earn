export interface Task {
  id: string;
  title: string;
  link?: string;
  reward: {
    points: number;
    coins: number;
  };
  platform: 'twitter' | 'discord' | 'telegram' | 'other';
  action: 'Visit' | 'Join' | 'Follow' | 'Fly' | 'Claim';
  category: 'CCGG' | 'IP Productions';
  createdAt: Date;
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt'>;