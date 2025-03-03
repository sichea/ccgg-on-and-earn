// features/task/components/TaskCard.js
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import '../styles/TaskStyles.css';

const TaskCard = ({ task, telegramUser, isAdmin, onClick }) => {
  const [joining, setJoining] = useState(false);
  
  // 사용자 정보
  const userId = telegramUser?.id || 'test-user-id';
  
  // 사용자가 이미 참여했는지 확인
  const hasJoined = task.participants?.includes(userId);
  
  const handleJoin = async (e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    
    if (hasJoined || joining) return;
    
    setJoining(true);
    try {
      const taskRef = doc(db, 'tasks', task.id);
      
      // 참여자 추가
      await updateDoc(taskRef, {
        participants: arrayUnion(userId)
      });
      
      // 사용자에게 보상 지급 로직 구현
      // 사용자의 포인트 정보를 가져옴
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // 현재 포인트에 태스크 보상 추가
        const currentPoints = userSnap.data().points || 0;
        await updateDoc(userRef, {
          points: currentPoints + (task.reward || 0),
          updatedAt: new Date()
        });
      } else {
        // 사용자 문서가 없으면 새로 생성
        await setDoc(userRef, {
          userId: userId,
          username: telegramUser?.username || '',
          points: task.reward || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      alert(`태스크 참여 완료! ${task.reward} GOLD 획득!`);
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
      <div className="task-card-content">
        <div className="task-card-title">
          {renderPlatformIcon()} {task.title}
        </div>
        <div className="task-card-description">{task.description}</div>
        
        {task.link && (
          <a 
            href={task.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="task-card-link"
            onClick={(e) => e.stopPropagation()} // 카드 클릭 이벤트 전파 방지
          >
            링크 열기 →
          </a>
        )}
      </div>
      
      <div className="task-card-actions">
        <div className="task-reward">
          <span className="reward-value">+ {task.reward} MOPI</span>
        </div>
        
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