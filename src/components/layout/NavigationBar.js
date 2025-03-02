// src/components/layout/NavigationBar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
  return (
    <nav className="navigation-bar">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">🎲</span>
        <span className="nav-text">Raffle</span>
      </NavLink>
      <NavLink to="/tasks" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">✓</span>
        <span className="nav-text">Tasks</span>
      </NavLink>
      <NavLink to="/earn" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">💰</span>
        <span className="nav-text">Earn</span>
      </NavLink>
      <NavLink to="/friends" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">👥</span>
        <span className="nav-text">Friends</span>
      </NavLink>
      <NavLink to="/wallet" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">💼</span>
        <span className="nav-text">Wallet</span>
      </NavLink>
    </nav>
  );
};

export default NavigationBar;