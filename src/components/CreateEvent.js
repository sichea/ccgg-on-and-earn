// src/components/CreateEvent.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './CreateEvent.css';

const CreateEvent = ({ telegramUser }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  const [winnerCount, setWinnerCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !endDate) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    // 날짜 유효성 검사
    const selectedDate = new Date(endDate);
    const today = new Date();
    
    if (selectedDate <= today) {
      alert("마감일은 오늘 이후 날짜로 설정해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('이벤트 생성 시작:', { 
        title, 
        description, 
        endDate, 
        createdBy: telegramUser.id,
        winnerCount 
      });
      
      const selectedDate = new Date(endDate);
      
      // Firestore에 이벤트 추가
      const eventsRef = collection(db, 'events');
      const docRef = await addDoc(eventsRef, {
        title,
        description,
        createdAt: Timestamp.now(),
        endDate: Timestamp.fromDate(selectedDate),
        createdBy: telegramUser ? telegramUser.id : 'unknown', // 텔레그램 유저 정보가 없는 경우 처리
        creatorName: telegramUser ? 
          (telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`) : 
          '관리자',
        isActive: true,
        participants: [],
        winnerCount: Number(winnerCount),
        winners: []
      });
      
      console.log('이벤트 생성 성공:', docRef.id);
      
      alert("이벤트가 성공적으로 생성되었습니다!");
      navigate(`/event/${docRef.id}`);
    } catch (error) {
      console.error("이벤트 생성 중 오류 발생:", error);
      alert(`이벤트 생성 오류: ${error.message || '알 수 없는 오류'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-event-container">
      <h1>새 래플 이벤트 만들기</h1>
      
      <form className="event-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">이벤트 제목 *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="이벤트 제목을 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">이벤트 설명 *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="이벤트 내용과 규칙을 설명해주세요"
            rows={5}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endDate">마감일 *</label>
          <input
            type="datetime-local"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="winnerCount">당첨자 수</label>
          <input
            type="number"
            id="winnerCount"
            value={winnerCount}
            onChange={(e) => setWinnerCount(e.target.value)}
            min={1}
            max={100}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/')}
          >
            취소
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? '생성 중...' : '이벤트 생성하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;