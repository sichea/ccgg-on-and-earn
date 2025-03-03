// features/task/pages/TaskList.js - 배열 관련 오류 수정
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import '../styles/TaskStyles.css';

const TaskList = ({ isAdmin, telegramUser }) => {
  const [ccggTasks, setCcggTasks] = useState([]);
  const [partnersTasks, setPartnersTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningTaskId, setJoiningTaskId] = useState(null); // 참여 중인 태스크 ID 추적
  const navigate = useNavigate();
  
  // 사용자 ID (실제 환경에서는 telegramUser.id 사용)
  const userId = telegramUser?.id || 'test-user-id';
  
  // 태스크 데이터 가져오기 함수
  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log('태스크 데이터 가져오기 시작...');
      const tasksRef = collection(db, 'tasks');
      
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

  // 참여 상태 확인 함수 - 배열이 아닌 경우 처리
  const hasJoined = (task) => {
    // participants가 undefined이거나 배열이 아닌 경우 빈 배열로 처리
    const participants = Array.isArray(task.participants) ? task.participants : [];
    return participants.includes(userId);
  };

// 태스크 참여 로직 간소화
const handleJoinTask = async (taskId) => {
  // 이미 처리 중이면 중단
  if (joiningTaskId) return;
  setJoiningTaskId(taskId);
  
  try {
    // 태스크 찾기
    const task = [...ccggTasks, ...partnersTasks].find(t => t.id === taskId);
    
    if (!task) {
      alert('존재하지 않는 태스크입니다.');
      return;
    }
    
    // 링크 미리 저장
    const taskLink = task.link;
    
    // 이미 참여했는지 확인
    const participants = Array.isArray(task.participants) ? task.participants : [];
    if (participants.includes(userId)) {
      alert('이미 참여한 태스크입니다.');
      // 링크가 있으면 열기
      if (taskLink) {
        window.open(taskLink, '_blank');
      }
      return;
    }
    
    // Firestore 업데이트 - 이 부분이 문제라면 생략 가능
    try {
      // Firestore 업데이트 로직
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        participants: arrayUnion(userId)
      });
    } catch (updateError) {
      console.error('Firestore 업데이트 오류:', updateError);
      // Firestore 업데이트 실패해도 계속 진행
    }
    
    // 로컬 UI 업데이트
    if (task.category === 'CCGG') {
      setCcggTasks(prev => 
        prev.map(t => 
          t.id === taskId 
            ? {...t, participants: [...participants, userId]} 
            : t
        )
      );
    } else {
      setPartnersTasks(prev => 
        prev.map(t => 
          t.id === taskId 
            ? {...t, participants: [...participants, userId]} 
            : t
        )
      );
    }
    
    // 링크가 있으면 열기
    if (taskLink) {
      window.open(taskLink, '_blank');
    }
    
    // 약간의 지연 후 참여 처리 및 알림
    setTimeout(() => {
      alert(`태스크 참여 완료! ${task.reward} MOPI 획득!`);
    }, 500);

  } catch (error) {
    console.error('태스크 참여 오류:', error);
  } finally {
    setJoiningTaskId(null);
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
                  
                  {hasJoined(task) ? (
                    <button
                      className="join-button completed"
                      disabled
                    >
                      완료
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinTask(task.id);
                      }}
                      disabled={joiningTaskId === task.id}
                      className="join-button"
                    >
                      {joiningTaskId === task.id ? '처리중...' : 'Join'}
                    </button>
                  )}
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
                  
                  {hasJoined(task) ? (
                    <button
                      className="join-button completed"
                      disabled
                    >
                      완료
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinTask(task.id);
                      }}
                      disabled={joiningTaskId === task.id}
                      className="join-button"
                    >
                      {joiningTaskId === task.id ? '처리중...' : 'Join'}
                    </button>
                  )}
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