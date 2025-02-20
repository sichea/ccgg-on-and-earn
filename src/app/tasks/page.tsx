'use client';

import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  MessageSquare, 
  Twitter, 
  Edit2, 
  Trash2, 
  Plus, 
  X,
  Link
} from 'lucide-react';
import { isAdminUser, ADMIN_USER_IDS } from '@/config/admin';


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
  category: 'CCGG' | 'IP Productions';
}

// Telegram WebApp 타입 정의

const TaskList = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '테스트',
      link: 'https://example.com',
      reward: { points: 11, coins: 11 },
      platform: 'telegram',
      action: 'Join',
      category: 'CCGG'
    }
  ]);

  const [formData, setFormData] = useState<Omit<Task, 'id'>>({
    title: '',
    platform: 'twitter',
    category: 'CCGG',
    link: '',
    reward: { points: 0, coins: 0 },
    action: 'Join'
  });


  useEffect(() => {
    const webapp = window.Telegram?.WebApp;
    if (webapp?.initDataUnsafe?.user?.id) {
      const userId = webapp.initDataUnsafe.user.id;
      alert(`
        Debug Info:
        User ID: ${userId}
        Is Admin Check: ${isAdminUser(userId.toString())}
        Admin IDs: ${ADMIN_USER_IDS.join(', ')}
      `);
    } else {
      alert('No user data found');
    }
  }, []);

  useEffect(() => {
    const webapp = window.Telegram?.WebApp;
    if (webapp?.initDataUnsafe?.user?.id) {
      const userId = webapp.initDataUnsafe.user.id.toString();
      setIsAdmin(isAdminUser(userId));
    }
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'discord':
        return <MessageSquare className="h-5 w-5" />;
      case 'telegram':
        return <Link2 className="h-5 w-5" />;
      default:
        return <Link className="h-5 w-5" />;
    }
  };

  const handleTaskClick = (task: Task) => {
    if (task.link) {
      window.open(task.link, '_blank');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      platform: task.platform,
      category: task.category,
      link: task.link || '',
      reward: { ...task.reward },
      action: task.action
    });
    setIsFormOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('이 태스크를 삭제하시겠습니까?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      setTasks(tasks.map(task => 
        task.id === editingTask.id 
          ? { ...task, ...formData }
          : task
      ));
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        ...formData
      };
      setTasks([...tasks, newTask]);
    }

    setIsFormOpen(false);
    setEditingTask(null);
    setFormData({
      title: '',
      platform: 'twitter',
      category: 'CCGG',
      link: '',
      reward: { points: 0, coins: 0 },
      action: 'Join'
    });
  };

  const groupedTasks = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#18191b] text-white">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl">Task 관리</h1>
          {isAdmin && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-[#0066FF] text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="w-5 h-5 mr-1" />
              태스크 추가
            </button>
          )}
        </div>

        {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
          <div key={category} className="mb-4">
            <div className="text-lg mb-2">{category}</div>
            {categoryTasks.map(task => (
              <div 
                key={task.id} 
                className="bg-[#1e2023] rounded-lg p-4 mb-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getPlatformIcon(task.platform)}
                  <div>
                    <div>{task.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-400">🪙 {task.reward.points}</span>
                      <span>+</span>
                      <span className="text-blue-400">💎 {task.reward.coins}</span>
                    </div>
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTaskClick(task)}
                      className="bg-[#0066FF] text-white px-4 py-2 rounded-lg"
                    >
                      {task.action}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleTaskClick(task)}
                    className="bg-[#0066FF] text-white px-4 py-2 rounded-lg"
                  >
                    {task.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}

        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1e2023] rounded-lg p-4 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg">
                  {editingTask ? '태스크 수정' : '새 태스크 추가'}
                </h3>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingTask(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 폼 내용은 이전과 동일 */}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;