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
  Check,
  Loader2
} from 'lucide-react';
import { isAdminUser } from '@/config/admin';

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
  isCompleted?: boolean;
}

const TaskList = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  // 관리자 권한 확인
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.initDataUnsafe?.user?.id) {
      const userId = webApp.initDataUnsafe.user.id;
      setIsAdmin(isAdminUser(userId));
    }
  }, []);

  // 태스크 목록 불러오기
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      
      const response = await fetch('/api/tasks', {
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-user-id': userId?.toString() || ''
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '태스크 목록을 불러오는데 실패했습니다.');
      }
  
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : '태스크 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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

  const showMessage = (title: string, message: string) => {
    try {
      (window.Telegram.WebApp as any).showPopup({ title, message });
    } catch (e) {
      alert(message);
    }
  };

  const handleTaskClick = async (task: Task) => {
    if (task.isCompleted) {
      showMessage('완료됨', '이미 완료한 태스크입니다.');
      return;
    }
  
    if (task.link) {
      window.open(task.link, '_blank');
    }
  
    try {
      setCompleting(task.id);
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-user-id': userId?.toString() || ''
        },
        body: JSON.stringify({ taskId: task.id })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '태스크 완료 처리에 실패했습니다.');
      }
  
      await fetchTasks();
      showMessage('완료!', data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '태스크 완료 처리에 실패했습니다.');
      showMessage('오류', err instanceof Error ? err.message : '태스크 완료 처리에 실패했습니다.');
    } finally {
      setCompleting(null);
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
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('태스크 삭제에 실패했습니다.');
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : '태스크 삭제에 실패했습니다.');
    }
  };

  const [formData, setFormData] = useState<Omit<Task, 'id'>>({
    title: '',
    platform: 'twitter',
    category: 'CCGG',
    link: '',
    reward: { points: 0, coins: 0 },
    action: 'Join'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/tasks', {
        method: editingTask ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingTask && { id: editingTask.id }),
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error(editingTask ? '태스크 수정에 실패했습니다.' : '태스크 생성에 실패했습니다.');
      }

      await fetchTasks();
      
      // 폼 초기화
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
    } catch (err) {
      setError(err instanceof Error ? err.message : '작업에 실패했습니다.');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500 text-white rounded-lg">
        {error}
      </div>
    );
  }

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

        {/* 태스크 추가/수정 폼 모달 */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              {/* ... (기존 폼 코드 유지) ... */}
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
                className={`bg-gray-800 rounded-lg p-4 mb-3 ${
                  task.isCompleted ? 'opacity-50' : ''
                }`}
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
                      disabled={task.isCompleted || completing === task.id}
                      className={`px-4 py-2 rounded-lg ${
                        task.isCompleted
                          ? 'bg-gray-600'
                          : completing === task.id
                          ? 'bg-blue-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white flex items-center gap-2`}
                    >
                      {completing === task.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          처리중...
                        </>
                      ) : task.isCompleted ? (
                        '완료됨'
                      ) : (
                        task.action
                      )}
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