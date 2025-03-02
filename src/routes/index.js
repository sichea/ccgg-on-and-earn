import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EventList from '../features/raffle/pages/EventList';
import EventDetail from '../features/raffle/pages/EventDetail';
import CreateEvent from '../features/raffle/pages/CreateEvent';

const AppRoutes = ({ telegramUser, isAdmin }) => {
  return (
    <Routes>
      <Route path="/" element={<EventList telegramUser={telegramUser} isAdmin={isAdmin} />} />
      <Route path="/event/:id" element={<EventDetail telegramUser={telegramUser} isAdmin={isAdmin} />} />
      <Route path="/create" element={<CreateEvent telegramUser={telegramUser} isAdmin={isAdmin} />} />
      {/* 미래에 추가될 라우트 */}
      <Route path="/tasks" element={<div>Tasks Page (벤)</div>} />
      <Route path="/earn" element={<div>Earn Page (타)</div>} />
      <Route path="/friends" element={<div>Friends Page (코)</div>} />
      <Route path="/wallet" element={<div>Wallet Page (똥)</div>} />
    </Routes>
  );
};

export default AppRoutes;