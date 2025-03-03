// routes/index.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// 래플 관련 페이지
import EventList from '../features/raffle/pages/EventList';
import EventDetail from '../features/raffle/pages/EventDetail';
import CreateEvent from '../features/raffle/pages/CreateEvent';

// 태스크 관련 페이지
import TaskList from '../features/task/pages/TaskList';
import CreateTask from '../features/task/pages/CreateTask';
import TaskDetail from '../features/task/pages/TaskDetail';

// Earn 관련 페이지
import DailyClaim from '../features/earn/pages/DailyClaim';

// Friends 페이지 추가
import Friends from '../features/friends/pages/Friends';

const AppRoutes = ({ telegramUser, isAdmin }) => {
  return (
    <div className="content-container pb-16"> {/* 네비게이션 바 공간 확보 */}
      <Routes>
        {/* Raffle 라우트 */}
        <Route path="/" element={<EventList telegramUser={telegramUser} isAdmin={isAdmin} />} />
        <Route path="/event/:id" element={<EventDetail telegramUser={telegramUser} isAdmin={isAdmin} />} />
        <Route path="/create" element={<CreateEvent telegramUser={telegramUser} isAdmin={isAdmin} />} />
        
        {/* Task 라우트 */}
        <Route path="/task" element={<TaskList telegramUser={telegramUser} isAdmin={isAdmin} />} />
        <Route path="/task/create" element={<CreateTask telegramUser={telegramUser} isAdmin={isAdmin} />} />
        <Route path="/task/:id" element={<TaskDetail telegramUser={telegramUser} isAdmin={isAdmin} />} />
        
        {/* Earn 라우트 */}
        <Route path="/earn" element={<DailyClaim telegramUser={telegramUser} isAdmin={isAdmin} />} />
        
        {/* Friends 라우트 - 구현된 컴포넌트로 변경 */}
        <Route path="/friends" element={<Friends telegramUser={telegramUser} isAdmin={isAdmin} />} />
        
        {/* Wallet 라우트는 아직 미구현 상태 */}
        <Route path="/wallet" element={<div className="p-4 text-white">Wallet 기능 - 준비 중</div>} />
      </Routes>
    </div>
  );
};

export default AppRoutes;