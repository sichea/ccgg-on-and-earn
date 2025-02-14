// src/components/BottomNav.tsx
import Link from 'next/link';
import { ListTodo, GamepadIcon, Users, Trophy } from 'lucide-react';

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
      <div className="flex justify-around p-2">
        <Link href="/tasks" className="flex flex-col items-center p-2">
          <ListTodo className="h-6 w-6" />
          <span className="text-xs mt-1">Task</span>
        </Link>
        <Link href="/games" className="flex flex-col items-center p-2">
          <GamepadIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Game</span>
        </Link>
        <Link href="/friends" className="flex flex-col items-center p-2">
          <Users className="h-6 w-6" />
          <span className="text-xs mt-1">Friends</span>
        </Link>
        <Link href="/ranking" className="flex flex-col items-center p-2">
          <Trophy className="h-6 w-6" />
          <span className="text-xs mt-1">Ranking</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;