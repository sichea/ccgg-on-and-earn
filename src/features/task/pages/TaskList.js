// features/task/pages/TaskList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
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

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('정말 이 태스크를 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      alert('태스크가 삭제되었습니다.');
      // 목록 새로고침
      fetchTasks();
    } catch (error) {
      console.error('태스크 삭제 오류:', error);
      alert('태스크 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditTask = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  const handleJoinTask = async (taskId) => {
    if (!telegramUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    const userId = telegramUser.id;
    
    // 이미 참여한 태스크인지 확인
    const task = [...ccggTasks, ...partnersTasks].find(t => t.id === taskId);
    if (task?.participants?.includes(userId)) {
      alert('이미 참여한 태스크입니다.');
      return;
    }
    
    try {
      const taskRef = doc(db, 'tasks', taskId);
      
      // 참여자 추가
      await updateDoc(taskRef, {
        participants: arrayUnion(userId)
      });
      
      // 사용자에게 보상 지급 로직 구현
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
      
      alert(`태스크 참여 완료! ${task.reward} MOPI 획득!`);
      // 목록 새로고침
      fetchTasks();
    } catch (error) {
      console.error('태스크 참여 오류:', error);
      alert('태스크 참여 중 오류가 발생했습니다.');
    }
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
      
      <div className="category-title">CCGG</div>
      {loading ? (
        <div className="loading-text">로딩 중...</div>
      ) : (
        <>
          {ccggTasks.length > 0 ? (
            ccggTasks.map(task => (
              <div key={task.id} className="task-card">
                <div className="task-card-left">
                  <div className="task-card-link-icon">🔗</div>
                  <div>
                    <div className="task-card-title">{task.title}</div>
                    <div className="task-card-rewards">
                      <span className="coin-icon">🪙</span>
                      <span className="reward-value">{task.reward || 11}</span>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinTask(task.id);
                    }}
                    className="join-button"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="task-card">
              <div className="task-card-left">
                <div className="task-card-link-icon">🔗</div>
                <div>
                  <div className="task-card-title">테스트</div>
                  <div className="task-card-rewards">
                    <span className="coin-icon">🪙</span>
                    <span className="reward-value">11</span>
                  </div>
                </div>
              </div>
              
              <div className="task-card-actions">
                <button className="join-button">
                  Join
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="category-title" style={{ marginTop: '24px' }}>Partners</div>
      {loading ? (
        <div className="loading-text">로딩 중...</div>
      ) : (
        <>
          {partnersTasks.length > 0 ? (
            partnersTasks.map(task => (
              <div key={task.id} className="task-card">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinTask(task.id);
                    }}
                    className="join-button"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">이 카테고리에 태스크가 없습니다</div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;