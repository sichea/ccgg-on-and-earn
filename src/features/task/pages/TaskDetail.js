// features/task/pages/TaskDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  
  // Telegram WebApp에서 사용자 정보 가져오기
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id || 'test-user-id';
  
  // 관리자 체크 - 실제 구현 시 관리자 ID 목록을 확인하는 로직으로 대체
  const isAdmin = true; // 테스트를 위해 임시로 true로 설정
  
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
          username: user?.username || '',
          points: task.reward || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      alert(`태스크 참여 완료! ${task.reward} mopi 획득!`);
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
    return <div className="p-4 text-white text-center">로딩 중...</div>;
  }
  
  if (!task) {
    return <div className="p-4 text-white text-center">태스크를 찾을 수 없습니다.</div>;
  }
  
  // 편집 모드
  if (editing && isAdmin) {
    return (
      <div className="p-4 bg-[#1c2333] min-h-screen">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => setEditing(false)}
            className="text-white mr-2"
          >
            &larr;
          </button>
          <h1 className="text-xl font-bold text-white">태스크 수정</h1>
        </div>
        
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">카테고리</label>
            <select
              name="category"
              value={editData.category}
              onChange={handleEditChange}
              className="w-full bg-[#232d42] text-white p-3 rounded-md border border-[#393f4a]"
            >
              <option value="CCGG">CCGG</option>
              <option value="Partners">Partners</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-400 mb-1">태스크 제목</label>
            <input
              type="text"
              name="title"
              value={editData.title}
              onChange={handleEditChange}
              placeholder="태스크 제목을 입력하세요"
              className="w-full bg-[#232d42] text-white p-3 rounded-md border border-[#393f4a]"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-1">플랫폼</label>
            <select
              name="platform"
              value={editData.platform}
              onChange={handleEditChange}
              className="w-full bg-[#232d42] text-white p-3 rounded-md border border-[#393f4a]"
            >
              <option value="Twitter">Twitter</option>
              <option value="Discord">Discord</option>
              <option value="Telegram">Telegram</option>
              <option value="Other">기타</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-400 mb-1">링크</label>
            <input
              type="url"
              name="link"
              value={editData.link}
              onChange={handleEditChange}
              placeholder="https://"
              className="w-full bg-[#232d42] text-white p-3 rounded-md border border-[#393f4a]"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-1">설명</label>
            <textarea
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              placeholder="태스크에 대한 설명을 입력하세요"
              rows="3"
              className="w-full bg-[#232d42] text-white p-3 rounded-md border border-[#393f4a]"
            ></textarea>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-400 mb-1">포인트</label>
              <input
                type="number"
                name="reward"
                value={editData.reward}
                onChange={handleEditChange}
                min="0"
                className="w-full bg-[#232d42] text-white p-3 rounded-md border border-[#393f4a]"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 bg-gray-600 text-white p-3 rounded-md"
            >
              취소
            </button>
            
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white p-3 rounded-md"
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
    <div className="p-4 bg-[#1c2333] min-h-screen">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => navigate('/task')}
          className="text-white mr-2"
        >
          &larr;
        </button>
        <h1 className="text-xl font-bold text-white">태스크 상세</h1>
      </div>
      
      <div className="bg-[#232d42] rounded-lg p-4 shadow-md border border-[#393f4a]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-white font-medium text-lg">{task.title}</div>
            <div className="text-gray-400 text-sm mt-1">카테고리: {task.category}</div>
            <div className="text-gray-400 text-sm">플랫폼: {task.platform}</div>
          </div>
          
          <div className="flex items-center">
            <div className="flex mr-2">
              <img 
                src="/images/mopi-coin.png" 
                alt="mopi" 
                className="w-5 h-5 mr-1" 
              />
              <span className="text-yellow-400 font-medium">{task.reward}</span>
            </div>
          </div>
        </div>
        
        <div className="text-white mt-4">
          <h3 className="text-gray-400 mb-2">설명</h3>
          <p className="whitespace-pre-line">{task.description}</p>
        </div>
        
        {task.link && (
          <div className="mt-4">
            <h3 className="text-gray-400 mb-2">링크</h3>
            <a 
              href={task.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#58a6ff] break-all"
            >
              {task.link}
            </a>
          </div>
        )}
        
        <div className="mt-4">
          <h3 className="text-gray-400 mb-2">참여 현황</h3>
          <p className="text-white">총 {participantsCount}명 참여</p>
        </div>
        
        <div className="mt-6 flex gap-2">
          {!hasJoined ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md"
            >
              {joining ? '처리 중...' : '참여하기'}
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-green-700 text-white py-2 rounded-md"
            >
              참여 완료
            </button>
          )}
          
          {isAdmin && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                수정
              </button>
              
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md"
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