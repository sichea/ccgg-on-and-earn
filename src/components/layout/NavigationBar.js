// NavigationBar.js 원래 버전으로 복원
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 현재 경로에 따라 활성화된 아이콘 변경
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="navigation-bar">
      <div 
        className={`nav-item ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <div className="nav-icon">🎟️</div>
        <div className="nav-label">Raffle</div>
      </div>
      
      <div 
        className={`nav-item ${isActive('/task') ? 'active' : ''}`}
        onClick={() => navigate('/task')}
      >
        <div className="nav-icon">✅</div>
        <div className="nav-label">Tasks</div>
      </div>
      
      <div 
        className={`nav-item ${isActive('/earn') ? 'active' : ''}`}
        onClick={() => navigate('/earn')}
      >
        <div className="nav-icon">💰</div>
        <div className="nav-label">Earn</div>
      </div>
      
      <div 
        className={`nav-item ${isActive('/friends') ? 'active' : ''}`}
        onClick={() => navigate('/friends')}
      >
        <div className="nav-icon">👥</div>
        <div className="nav-label">Friends</div>
      </div>
      
      <div 
        className={`nav-item ${isActive('/wallet') ? 'active' : ''}`}
        onClick={() => navigate('/wallet')}
      >
        <div className="nav-icon">💼</div>
        <div className="nav-label">Wallet</div>
      </div>
    </div>
  );
};

export default NavigationBar;