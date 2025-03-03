// src/components/layout/NavigationBar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 현재 경로에 따라 활성화된 탭 결정
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/event') || path.startsWith('/create')) return 'raffle';
    if (path.startsWith('/task')) return 'task';
    if (path.startsWith('/earn')) return 'earn';
    if (path.startsWith('/friends')) return 'friends';
    if (path.startsWith('/wallet')) return 'wallet';
    return 'raffle'; // 기본값
  };
  
  const activeTab = getActiveTab();
  
  return (
    <div className="navigation-bar">
      <div 
        className={`nav-item ${activeTab === 'task' ? 'active' : ''}`}
        onClick={() => navigate('/task')}
      >
        <div className="nav-icon">☰</div>
        <div className="nav-text">Task</div>
      </div>
      
      <div 
        className={`nav-item ${activeTab === 'raffle' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <div className="nav-icon">🎟</div>
        <div className="nav-text">Raffle</div>
      </div>
      
      <div 
        className={`nav-item ${activeTab === 'earn' ? 'active' : ''}`}
        onClick={() => navigate('/earn')}
      >
        <div className="nav-icon">🪙</div>
        <div className="nav-text">Earn</div>
      </div>
      
      <div 
        className={`nav-item ${activeTab === 'friends' ? 'active' : ''}`}
        onClick={() => navigate('/friends')}
      >
        <div className="nav-icon">👥</div>
        <div className="nav-text">Friends</div>
      </div>
      
      <div 
        className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
        onClick={() => navigate('/wallet')}
      >
        <div className="nav-icon">💼</div>
        <div className="nav-text">Wallet</div>
      </div>
    </div>
  );
};

export default NavigationBar;