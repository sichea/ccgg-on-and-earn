// features/task/pages/TaskDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { getUserDocument, updateUserDocument } from '../../../utils/userUtils';
import '../styles/TaskStyles.css';

const TaskDetail = ({ isAdmin, telegramUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  
  // 사용자 ID 추출
  const userId = telegramUser?.id?.toString() || 'test-user-id';
  
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskRef = doc(db, 'tasks', id);
        const taskSnap = await getDoc(taskRef);
        
        if (taskSnap.exists()) {
          const taskData = {
            id: taskSnap.id,
            ...taskSnap.data()
          };
          
          setTask(taskData);
          setEditData(taskData);
        } else {
          alert('존재하지 않는 태스크입니다.');
          navigate('/task');
        }
      } catch (error) {
        console.error('태스크 로딩 오류:', error);
        alert('태스크를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [id, navigate]);
  
  // 사용자가 이미 참여했는지 확인
  const hasJoined = task?.participants?.includes(userId);
  
  const handleJoin = async () => {
    if (hasJoined || joining) return;
    
    setJoining(true);
    try {
      const taskRef = doc(db, 'tasks', id);
      
      // 참여자 추가
      await updateDoc(taskRef, {
        participants: arrayUnion(userId),
        updatedAt: new Date()
      });
      
      // 사용자 정보 가져오기 및 업데이트
      const userData = await getUserDocument(telegramUser);
      
      if (userData) {
        // 포인트 업데이트
        await updateUserDocument(userId, {
          points: (userData.points || 0) + (task.reward || 0),
          updatedAt: new Date()
        });
      }
      
      alert(`태스크 참여 완료! ${task.reward} CGP 획득!`);
      // 태스크 정보 갱신
      const updatedTaskSnap = await getDoc(taskRef);
      setTask({
        id: updatedTaskSnap.id,
        ...updatedTaskSnap.data()
      });
    } catch (error) {
      console.error('태스크 참여 오류:', error);
      alert('태스크 참여 중 오류가 발생했습니다.');
    } finally {
      setJoining(false);
    }
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: name === 'reward' ? parseInt(value) || 0 : value
    }));
  };
  
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    try {
      // 필수 필드 검증
      if (!editData.title || !editData.description || !editData.reward) {
        alert('제목, 설명, 보상은 필수 입력 사항입니다.');
        return;
      }
      
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        ...editData,
        updatedAt: new Date()
      });
      
      alert('태스크가 성공적으로 수정되었습니다.');
      setTask(editData);
      setEditing(false);
    } catch (error) {
      console.error('태스크 수정 오류:', error);
      alert('태스크 수정 중 오류가 발생했습니다.');
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('정말 이 태스크를 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, 'tasks', id));
      alert('태스크가 삭제되었습니다.');
      navigate('/task');
    } catch (error) {
      console.error('태스크 삭제 오류:', error);
      alert('태스크 삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 참여자 수 계산
  const participantsCount = task?.participants?.length || 0;
  
  if (loading) {
    return <div className="loading-text">로딩 중...</div>;
  }
  
  if (!task) {
    return <div className="empty-state">태스크를 찾을 수 없습니다.</div>;
  }
  
  // 편집 모드
  if (editing && isAdmin) {
    return (
      <div className="task-container">
        <div className="task-header">
          <button 
            onClick={() => setEditing(false)}
            className="back-button"
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem' }}
          >
            ←
          </button>
          <div className="task-title">태스크 수정</div>
        </div>
        
        <form onSubmit={handleSubmitEdit} className="task-form">
          {/* 폼 코드는 그대로 유지 */}
          {/* ... */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>카테고리</label>
            <select
              name="category"
              value={editData.category}
              onChange={handleEditChange}
              className="form-select"
              style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
            >
              <option value="CCGG">CCGG</option>
              <option value="Partners">Partners</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>태스크 제목</label>
            <input
              type="text"
              name="title"
              value={editData.title}
              onChange={handleEditChange}
              placeholder="태스크 제목을 입력하세요"
              className="form-input"
              style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>플랫폼</label>
            <select
              name="platform"
              value={editData.platform}
              onChange={handleEditChange}
              className="form-select"
              style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
            >
              <option value="Twitter">Twitter</option>
              <option value="Discord">Discord</option>
              <option value="Telegram">Telegram</option>
              <option value="Other">기타</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>링크</label>
            <input
              type="url"
              name="link"
              value={editData.link}
              onChange={handleEditChange}
              placeholder="https://"
              className="form-input"
              style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>설명</label>
            <textarea
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              placeholder="태스크에 대한 설명을 입력하세요"
              rows="3"
              className="form-textarea"
              style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>보상 (CGP)</label>
            <input
              type="number"
              name="reward"
              value={editData.reward}
              onChange={handleEditChange}
              min="0"
              className="form-input"
              style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
            />
          </div>
          
          <div className="form-actions" style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="cancel-button"
              style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#4b5563', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              취소
            </button>
            
            <button
              type="submit"
              className="submit-button"
              style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              저장
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  // 상세 보기 모드
  return (
    <div className="task-container">
      <div className="task-header">
        <button 
          onClick={() => navigate('/task')}
          className="back-button"
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem' }}
        >
          ←
        </button>
        <div className="task-title">태스크 상세</div>
      </div>
      
      <div style={{ backgroundColor: '#232d42', borderRadius: '6px', padding: '16px', marginTop: '16px' }}>
        {/* 상세 정보 코드는 그대로 유지 */}
        {/* ... */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ color: 'white', fontWeight: '500', fontSize: '1.125rem' }}>{task.title}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '4px' }}>카테고리: {task.category === 'CCGG' ? 'CCGG' : 'Partners'}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>플랫폼: {task.platform}</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ color: '#f9ca24', fontWeight: '500' }}>+{task.reward} CGP</div>
          </div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '0.875rem' }}>설명</h3>
          <p style={{ color: 'white', whiteSpace: 'pre-line' }}>{task.description}</p>
        </div>
        
        {task.link && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '0.875rem' }}>링크</h3>
            <a 
              href={task.link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', wordBreak: 'break-all' }}
            >
              {task.link}
            </a>
          </div>
        )}
        
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '0.875rem' }}>참여 현황</h3>
          <p style={{ color: 'white' }}>총 {participantsCount}명 참여</p>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
          {!hasJoined ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{ 
                flex: '1', 
                backgroundColor: '#2563eb', 
                color: 'white', 
                padding: '8px 0', 
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer' 
              }}
            >
              {joining ? '처리 중...' : 'Go'}
            </button>
          ) : (
            <button
              disabled
              style={{ 
                flex: '1', 
                backgroundColor: '#16a34a', 
                color: 'white', 
                padding: '8px 0', 
                borderRadius: '6px',
                border: 'none',
                cursor: 'not-allowed' 
              }}
            >
              완료
            </button>
          )}
          
          {isAdmin && (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{ 
                  backgroundColor: '#4b5563', 
                  color: 'white', 
                  padding: '8px 16px', 
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                수정
              </button>
              
              <button
                onClick={handleDelete}
                style={{ 
                  backgroundColor: '#dc2626', 
                  color: 'white', 
                  padding: '8px 16px', 
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;