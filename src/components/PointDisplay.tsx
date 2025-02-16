// src/components/PointDisplay.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function PointDisplay() {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPoints() {
      try {
        const response = await fetch('/api/points');
        if (!response.ok) {
          throw new Error('Failed to fetch points');
        }
        const data = await response.json();
        setPoints(data.points);
      } catch (error) {
        setError('포인트 정보를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg">
      {error}
    </div>
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">내 포인트</h2>
      <p className="text-2xl font-bold text-blue-600">
        {points?.toLocaleString() ?? 0} P
      </p>
    </div>
  );
}