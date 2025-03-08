// features/task/components/TaskCard.js
import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { getUserDocument, updateUserDocument } from '../../../utils/userUtils';
import '../styles/TaskStyles.css';

const TaskCard = ({ task, telegramUser, isAdmin, onClick }) => {
  const [joining, setJoining] = useState(false);
  
  // 사용자 정보
  const userId = telegramUser?.id?.toString() || 'test-user-id';
  
  // 사용자가 이미 참여했는지 확인
  const hasJoined = task.participants?.includes(userId);
  
  const handleJoin = async (e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    
    if (hasJoined || joining) return;
    
    setJoining(true);
    try {
      // 태스크 문서 업데이트 - 참여자 추가
      const taskRef = doc(db, 'tasks', task.id);
      
      // 사용자 정보 가져오기
      const userData = await getUserDocument(telegramUser);
      
      if (userData) {
        // 현재 포인트에 태스크 보상 추가
        const updatedUser = await updateUserDocument(userId, {
          points: (userData.points || 0) + (task.reward || 0),
          updatedAt: new Date()
        });
        
        if (updatedUser) {
          console.log("포인트 업데이트 성공:", updatedUser.points);
        }
      }
      
      alert(`태스크 참여 완료! ${task.reward} CGP 획득!`);
      window.location.reload(); // UI 갱신을 위한 새로고침
    } catch (error) {
      console.error('태스크 참여 오류:', error);
      alert('태스크 참여 중 오류가 발생했습니다.');
    } finally {
      setJoining(false);
    }
  };
  
  // 플랫폼에 따른 아이콘 렌더링
  const renderPlatformIcon = () => {
    switch (task.platform) {
      case 'Twitter':
        return <span style={{ fontSize: '1rem', marginRight: '6px' }}>𝕏</span>;
      case 'Telegram':
        return <span style={{ fontSize: '1rem', marginRight: '6px' }}>✈️</span>;
      case 'Discord':
        return <span style={{ fontSize: '1rem', marginRight: '6px' }}>👾</span>;
      case 'Wallet':
        return <span style={{ fontSize: '1rem', marginRight: '6px' }}>💼</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-left">
        <div className="task-card-link-icon">🔗</div>
        <div>
          <div className="task-card-title">{task.title}</div>
          <div className="task-card-rewards">
            <span className="coin-icon">🪙</span>
            <span className="reward-value">{task.reward || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="task-card-actions">
        {isAdmin && (
          <>
            <button 
              className="task-card-action-button"
              onClick={(e) => {
                e.stopPropagation();
                handleEditTask(task.id);
              }}
            >
              ✏️
            </button>
            <button 
              className="task-card-action-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTask(task.id);
              }}
            >
              🗑️
            </button>
          </>
        )}
        
        <button
          onClick={handleJoin}
          disabled={hasJoined || joining}
          className={`join-button ${hasJoined ? 'completed' : ''}`}
        >
          {hasJoined ? '완료' : 'Go'}
        </button>
      </div>
    </div>
  );
};

export default TaskCard;