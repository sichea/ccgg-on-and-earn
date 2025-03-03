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
  
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const tasksRef = collection(db, 'tasks');
        
        // CCGG 카테고리 태스크 가져오기
        const ccggQuery = query(
          tasksRef,
          where('category', '==', 'CCGG'),
          orderBy('createdAt', 'desc')
        );
        
        const ccggSnapshot = await getDocs(ccggQuery);
        const ccggTasksList = ccggSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCcggTasks(ccggTasksList);
        
        // Partners 카테고리 태스크 가져오기
        const partnersQuery = query(
          tasksRef,
          where('category', '==', 'Partners'),
          orderBy('createdAt', 'desc')
        );
        
        const partnersSnapshot = await getDocs(partnersQuery);
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

    fetchTasks();
  }, []);

  const handleAddTask = () => {
    navigate('/task/create');
  };

  return (
    <div className="task-container">
      <div className="task-header">
        <div className="task-title">Task 관리</div>
        {isAdmin && (
          <button 
            onClick={handleAddTask}
            className="add-task-button"
          >
            <span>+</span> 태스크 추가
          </button>
        )}
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