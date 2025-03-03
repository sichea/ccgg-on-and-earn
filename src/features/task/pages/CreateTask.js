// features/task/pages/CreateTask.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import '../styles/TaskStyles.css';

const CreateTask = ({ telegramUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CCGG',
    platform: 'Twitter',
    link: '',
    reward: 100
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'reward' ? parseInt(value) || 0 : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 필수 필드 검증
      if (!formData.title || !formData.description || !formData.reward) {
        alert('제목, 설명, 보상은 필수 입력 사항입니다.');
        setSubmitting(false);
        return;
      }
      
      // Firestore에 태스크 추가
      await addDoc(collection(db, 'tasks'), {
        ...formData,
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: telegramUser?.id || 'unknown'
      });
      
      alert('태스크가 성공적으로 생성되었습니다.');
      navigate('/task');
    } catch (error) {
      console.error('태스크 생성 오류:', error);
      alert('태스크 생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  
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
        <div className="task-title">새 태스크 추가</div>
      </div>
      
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label className="form-label">카테고리</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
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
            value={formData.title}
            onChange={handleChange}
            placeholder="태스크 제목을 입력하세요"
            className="form-input"
            style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>플랫폼</label>
          <select
            name="platform"
            value={formData.platform}
            onChange={handleChange}
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
            value={formData.link}
            onChange={handleChange}
            placeholder="https://"
            className="form-input"
            style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>설명</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="태스크에 대한 설명을 입력하세요"
            rows="3"
            className="form-textarea"
            style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
          ></textarea>
        </div>
        
        <div className="form-group">
          <label className="form-label" style={{ display: 'block', color: '#a0a0a0', marginBottom: '4px' }}>보상 (GOLD)</label>
          <input
            type="number"
            name="reward"
            value={formData.reward}
            onChange={handleChange}
            min="0"
            className="form-input"
            style={{ padding: '12px', width: '100%', borderRadius: '6px', backgroundColor: '#232d42', color: 'white', border: '1px solid #393f4a', marginBottom: '16px' }}
          />
        </div>
        
        <div className="form-actions" style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={() => navigate('/task')}
            className="cancel-button"
            style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#4b5563', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            취소
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="submit-button"
            style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {submitting ? '처리 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;