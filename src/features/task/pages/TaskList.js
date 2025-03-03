// features/task/pages/TaskList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import TaskCard from '../components/TaskCard';
import '../styles/TaskStyles.css';

const TaskList = ({ isAdmin, telegramUser }) => {
  const [ccggTasks, setCcggTasks] = useState([]);
  const [partnersTasks, setPartnersTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // 태스크 데이터 가져오기 함수
  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log('태스크 데이터 가져오기 시작...');
      const tasksRef = collection(db, 'tasks');
      
      // 전체 태스크 목록 먼저 가져와서 콘솔에 출력 (디버깅용)
      const allTasksSnapshot = await getDocs(tasksRef);
      console.log('전체 태스크 수:', allTasksSnapshot.size);
      allTasksSnapshot.forEach(doc => {
        console.log('태스크 ID:', doc.id, '데이터:', doc.data());
      });
      
      // CCGG 카테고리 태스크 가져오기
      const ccggQuery = query(
        tasksRef,
        where('category', '==', 'CCGG')
      );
      
      const ccggSnapshot = await getDocs(ccggQuery);
      console.log('CCGG 태스크 수:', ccggSnapshot.size);
      
      const ccggTasksList = ccggSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCcggTasks(ccggTasksList);
      
      // Partners 카테고리 태스크 가져오기
      const partnersQuery = query(
        tasksRef,
        where('category', '==', 'Partners')
      );
      
      const partnersSnapshot = await getDocs(partnersQuery);
      console.log('Partners 태스크 수:', partnersSnapshot.size);
      
      const partnersTasksList = partnersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPartnersTasks(partnersTasksList);
    } catch (error) {
      console.error('태스크 불러오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = () => {
    navigate('/task/create');
  };

  return (
    <div className="task-container">
      <div className="task-header">
        <div className="task-title">Task 관리</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={fetchTasks}
            className="refresh-button"
            style={{ 
              backgroundColor: '#4b5563', 
              color: 'white', 
              padding: '8px 12px', 
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.875rem'
            }}
          >
            새로고침
          </button>
          
          {isAdmin && (
            <button 
              onClick={handleAddTask}
              className="add-task-button"
            >
              <span>+</span> 태스크 추가
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="loading-text">로딩 중...</div>
      ) : (
        <>
          {/* CCGG 카테고리 섹션 */}
          <div className="category-header">CCGG</div>
          <div className="category-content">
            {ccggTasks.length > 0 ? (
              ccggTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  telegramUser={telegramUser}
                  isAdmin={isAdmin}
                  onClick={() => navigate(`/task/${task.id}`)}
                />
              ))
            ) : (
              <div className="empty-state">이 카테고리에 태스크가 없습니다</div>
            )}
          </div>
          
          {/* Partners 카테고리 섹션 */}
          <div className="category-header">Partners</div>
          <div className="category-content">
            {partnersTasks.length > 0 ? (
              partnersTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  telegramUser={telegramUser}
                  isAdmin={isAdmin}
                  onClick={() => navigate(`/task/${task.id}`)}
                />
              ))
            ) : (
              <div className="empty-state">이 카테고리에 태스크가 없습니다</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TaskList;