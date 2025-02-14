// src/components/TaskList.tsx
import { Calendar, ExternalLink, Gamepad } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  reward: {
    points: number;
    coins: number;
  };
  type: 'daily' | 'game' | 'news' | 'webtoon';
  action: 'Fly' | 'Claim';
}

const TaskList = () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Play Sliding Game',
      reward: { points: 100, coins: 30 },
      type: 'game',
      action: 'Fly'
    },
    {
      id: '2',
      title: 'Play Mahjong Puzzle',
      reward: { points: 100, coins: 30 },
      type: 'game',
      action: 'Fly'
    },
    {
      id: '3',
      title: 'Check PromptTale\'s News',
      reward: { points: 50, coins: 15 },
      type: 'news',
      action: 'Claim'
    },
    // ... 더 많은 태스크 추가 가능
  ];

  return (
    <div className="bg-gray-900 min-h-screen pb-20">
      <div className="p-4">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="bg-gray-800 rounded-lg p-4 mb-3 flex justify-between items-center"
          >
            <div className="flex items-center">
              <div className="mr-3">
                {task.type === 'game' && <Gamepad className="h-6 w-6" />}  // GamepadIcon을 Gamepad로 변경
                {task.type === 'news' && <ExternalLink className="h-6 w-6" />}
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
              className={`px-4 py-2 rounded-lg ${
                task.action === 'Fly' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {task.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;