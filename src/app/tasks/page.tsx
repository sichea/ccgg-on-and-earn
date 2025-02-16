// src/app/tasks/page.tsx
import { PointDisplay } from '@/components/PointDisplay';
import { PointEarnButton } from '@/components/PointEarnButton';

export default function TasksPage() {
  return (
    <div className="container mx-auto p-4">
      <PointDisplay />
      
      <div className="mt-8">
        <h1 className="text-2xl font-bold mb-4">태스크 목록</h1>
        <div className="grid gap-4">
          {/* 태스크 목록은 나중에 구현 */}
        </div>
      </div>
    </div>
  );
}