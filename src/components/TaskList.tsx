'use client';

import { ExternalLink, Link2, MessageSquare, Twitter } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  link?: string;
  reward: {
    points: number;
    coins: number;
  };
  platform: 'twitter' | 'discord' | 'telegram' | 'other';
  action: 'Visit' | 'Join' | 'Follow' | 'Fly' | 'Claim';
}

interface TaskGroup {
  title: string;
  tasks: Task[];
}

const TaskList = () => {
  const taskGroups: TaskGroup[] = [
    {
      title: 'CCGG',
      tasks: [
        {
          id: '1',
          title: 'CCGG 텔레그램 채널 구독',
          link: 'https://t.me/ccgguild',
          reward: { points: 100, coins: 30 },
          platform: 'telegram',
          action: 'Join'
        },
        {
          id: '2',
          title: 'CCGG 디스코드 채널 참여',
          reward: { points: 150, coins: 45 },
          platform: 'discord',
          action: 'Join'
        },
        {
          id: '3',
          title: 'CCGG 트위터 팔로우',
          reward: { points: 100, coins: 30 },
          platform: 'twitter',
          action: 'Follow'
        }
      ]
    },
    {
      title: 'IP Productions',
      tasks: [
        {
          id: '4',
          title: 'Partner A 트위터 팔로우',
          reward: { points: 80, coins: 25 },
          platform: 'twitter',
          action: 'Follow'
        },
        {
          id: '5',
          title: 'Partner B 디스코드 참여',
          reward: { points: 120, coins: 35 },
          platform: 'discord',
          action: 'Join'
        }
      ]
    }
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="h-6 w-6" />;
      case 'discord':
        return <MessageSquare className="h-6 w-6" />;
      case 'telegram':
        return <Link2 className="h-6 w-6" />;
      default:
        return <ExternalLink className="h-6 w-6" />;
    }
  };

  const handleTaskClick = (task: Task) => {
    if (task.link) {
      window.open(task.link, '_blank');
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen pb-20">
      <div className="p-4">
        {taskGroups.map((group, index) => (
          <div key={index} className="mb-6">
            <div className="text-white text-lg mb-2">{group.title}</div>
            {group.tasks.map(task => (
              <div 
                key={task.id} 
                className="bg-gray-800 rounded-lg p-4 mb-3 flex justify-between items-center"
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {getPlatformIcon(task.platform)}
                  </div>
                  <div>
                    <div className="text-white">{task.title}</div>
                    <div className="text-sm text-yellow-500 flex items-center gap-2">
                      <span>🪙 {task.reward.points}</span>
                      <span>+ 💎 {task.reward.coins}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleTaskClick(task)}
                  className={`px-4 py-2 rounded-lg ${
                    task.action === 'Claim' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {task.action}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;