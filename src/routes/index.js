import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Raffle 관련 페이지
import EventList from '../features/raffle/pages/EventList';
import EventDetail from '../features/raffle/pages/EventDetail';
import CreateEvent from '../features/raffle/pages/CreateEvent';

// Task 관련 페이지
import TaskList from '../features/task/pages/TaskList';
import TaskDetail from '../features/task/pages/TaskDetail';
import CreateTask from '../features/task/pages/CreateTask';

// Earn 관련 페이지
import DailyClaim from '../features/earn/pages/DailyClaim';

// Friends 페이지 추가
import Friends from '../features/friends/pages/Friends';

const AppRoutes = () => {
  return (
    <Routes>
      {/* 기본 경로 */}
      <Route path="/" element={<Navigate to="/tasks" replace />} />

      {/* Raffle 관련 라우트 */}
      <Route path="/raffle" element={<EventList />} />
      <Route path="/raffle/create" element={<CreateEvent />} />
      <Route path="/raffle/:id" element={<EventDetail />} />

      {/* Task 관련 라우트 */}
      <Route path="/tasks" element={<TaskList />} />
      <Route path="/tasks/create" element={<CreateTask />} />
      <Route path="/tasks/:id" element={<TaskDetail />} />

      {/* Earn 관련 라우트 */}
      <Route path="/earn" element={<DailyClaim />} />

      {/* Friends 라우트 추가 */}
      <Route path="/friends" element={<Friends />} />

      {/* 404 페이지 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;