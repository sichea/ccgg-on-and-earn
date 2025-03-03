// features/task/pages/TaskList.js - 수정된 Join 로직
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

  // 태스크 참여 로직 수정
  const handleJoinTask = async (taskId) => {
    if (joiningTaskId) return; // 이미 참여 처리 중이면 중복 실행 방지
    
    setJoiningTaskId(taskId);
    
    try {
      // 현재 태스크 데이터 가져오기
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        alert('존재하지 않는 태스크입니다.');
        setJoiningTaskId(null);
        return;
      }
      
      const taskData = taskSnap.data();
      
      // 이미 참여했는지 확인
      if (taskData.participants && taskData.participants.includes(userId)) {
        alert('이미 참여한 태스크입니다.');
        setJoiningTaskId(null);
        return;
      }
      
      // 참여자 배열이 없으면 초기화
      const participants = taskData.participants || [];
      
      // 참여자 추가
      await updateDoc(taskRef, {
        participants: [...participants, userId]
      });
      
      // 사용자에게 보상 지급 로직 구현
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // 현재 포인트에 태스크 보상 추가
        const currentPoints = userSnap.data().points || 0;
        await updateDoc(userRef, {
          points: currentPoints + (taskData.reward || 0),
          updatedAt: new Date()
        });
      } else {
        // 사용자 문서가 없으면 새로 생성
        await setDoc(userRef, {
          userId: userId,
          username: telegramUser?.username || '',
          points: taskData.reward || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      alert(`태스크 참여 완료! ${taskData.reward} MOPI 획득!`);
      
      // 가져온 데이터에서 참여자 목록 업데이트 
      if (taskData.category === 'CCGG') {
        setCcggTasks(prev => 
          prev.map(t => 
            t.id === taskId 
              ? {...t, participants: [...(t.participants || []), userId]} 
              : t
          )
        );
      } else if (taskData.category === 'Partners') {
        setPartnersTasks(prev => 
          prev.map(t => 
            t.id === taskId 
              ? {...t, participants: [...(t.participants || []), userId]} 
              : t
          )
        );
      }
      
      // 링크가 있으면 새 탭에서 열기
      if (taskData.link) {
        window.open(taskData.link, '_blank');
      }
      
    } catch (error) {
      console.error('태스크 참여 오류:', error);
      alert('태스크 참여 중 오류가 발생했습니다.');
    } finally {
      setJoiningTaskId(null);
    }
  };

  // 참여 상태 확인 함수
  const hasJoined = (task) => {
    return task.participants && task.participants.includes(userId);
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