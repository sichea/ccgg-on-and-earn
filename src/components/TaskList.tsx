'use client';

import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Link2, 
  MessageSquare, 
  Twitter, 
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  Check 
} from 'lucide-react';
import { isAdminUser } from '@/config/admin';
import { useTasks, useUser } from '@/hooks/useFirebase';
import { TaskFormData } from '@/types/task';

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
  createdAt: Date;  // 추가
}

type FormData = Omit<Task, 'id' | 'createdAt'>;

const TaskList = () => {
  // Firebase hooks
  const { tasks, loading: tasksLoading, addTask, deleteTask, updateTask } = useTasks();
  const telegramId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
  const { user, loading: userLoading, updatePoints } = useUser(telegramId);

  // Local states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    platform: 'twitter',
    category: 'CCGG',
    link: '',
    reward: { points: 0, coins: 0 },
    action: 'Join'
  });

  // Admin check effect
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.initDataUnsafe?.user?.id) {
      const userId = webApp.initDataUnsafe.user.id;
      setIsAdmin(isAdminUser(userId));
    }
  }, []);

  // Loading state
  if (tasksLoading || userLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-white">Loading...</div>
    </div>;
  }

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

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('정말로 이 태스크를 삭제하시겠습니까?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
      } else {
        await addTask(formData);
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
    } catch (error) {
      console.error('Error submitting task:', error);
    }
  };

  // 카테고리별로 태스크 그룹화
  const groupedTasks = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {});

  return (
    <div className="bg-gray-900 min-h-screen pb-20">
      <div className="p-4">
        {/* 관리자 컨트롤 */}
        {isAdmin && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-lg">Task 관리</h2>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              태스크 추가
            </button>
          </div>
        )}

        {/* 태스크 추가/수정 폼 */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md my-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg">
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

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-300 mb-1 text-sm">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as 'CCGG' | 'IP Productions'})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="CCGG">CCGG</option>
                    <option value="IP Productions">IP Productions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">태스크 제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                    placeholder="태스크 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">플랫폼</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value as 'twitter' | 'discord' | 'telegram' | 'other'})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                  >
                    <option value="twitter">Twitter</option>
                    <option value="discord">Discord</option>
                    <option value="telegram">Telegram</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">링크</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                    placeholder="https://"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-gray-300 mb-1">포인트</label>
                    <input
                      type="number"
                      value={formData.reward.points}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reward: { ...formData.reward, points: parseInt(e.target.value) }
                      })}
                      className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                      min="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-300 mb-1">코인</label>
                    <input
                      type="number"
                      value={formData.reward.coins}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reward: { ...formData.reward, coins: parseInt(e.target.value) }
                      })}
                      className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">액션</label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({...formData, action: e.target.value as Task['action']})}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                  >
                    <option value="Join">Join</option>
                    <option value="Follow">Follow</option>
                    <option value="Visit">Visit</option>
                    <option value="Claim">Claim</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingTask(null);
                    }}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    {editingTask ? '수정' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 태스크 목록 */}
        {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
          <div key={category} className="mb-6">
            <div className="text-white text-lg mb-2">{category}</div>
            {categoryTasks.map(task => (
              <div 
                key={task.id} 
                className="bg-gray-800 rounded-lg p-4 mb-3"
              >
                <div className="flex justify-between items-center">
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
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
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
                      </>
                    )}
                    <button
                      onClick={() => handleTaskClick(task)}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {task.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;