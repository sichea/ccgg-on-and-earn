// src/components/PointEarnButton.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PointEarnButtonProps {
  taskId: string;
  points: number;
  onComplete?: () => void;
}

export function PointEarnButton({ taskId, points, onComplete }: PointEarnButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEarnPoints = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: points,
          type: 'TASK_COMPLETE',
          description: `Task ${taskId} completed`,
          metadata: { taskId }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to earn points');
      }

      onComplete?.();
    } catch (error) {
      setError('포인트 적립에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEarnPoints}
      disabled={loading}
      className={`
        px-4 py-2 rounded-lg font-medium
        ${loading 
          ? 'bg-gray-300 cursor-not-allowed' 
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
      `}
    >
      {loading ? '처리중...' : `${points}P 받기`}
    </button>
  );
}