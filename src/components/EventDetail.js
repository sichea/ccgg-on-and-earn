// src/components/EventDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  doc, getDoc, updateDoc, arrayUnion, arrayRemove, 
  onSnapshot, Timestamp, collection, addDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import './EventDetail.css';

const EventDetail = ({ telegramUser, isAdmin }) => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [winners, setWinners] = useState([]);
  const [participating, setParticipating] = useState(false);

  useEffect(() => {

    // 이벤트 데이터 가져오기
    const fetchEvent = async () => {
      try {
        const eventDoc = doc(db, 'events', id);
        const unsubscribe = onSnapshot(eventDoc, (docSnap) => {
          if (docSnap.exists()) {
            const eventData = docSnap.data();
            setEvent(eventData);
            setWinners(eventData.winners || []);
            
            // 현재 사용자가 참여 중인지 확인
            if (telegramUser) {
              const isParticipating = eventData.participants?.some(
                p => p.id === telegramUser.id
              );
              setParticipating(isParticipating);
            }
          } else {
            console.log("이벤트를 찾을 수 없습니다!");
          }
          setLoading(false);
        });

        // 댓글 실시간 업데이트
        const commentsRef = collection(db, 'events', id, 'comments');
        const commentsUnsubscribe = onSnapshot(commentsRef, (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => b.createdAt - a.createdAt);
          
          setComments(commentsData);
        });

        return () => {
          unsubscribe();
          commentsUnsubscribe();
        };
      } catch (error) {
        console.error("이벤트 로딩 중 오류 발생:", error);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, telegramUser]);

  const handleParticipate = async () => {
    if (!telegramUser) {
      alert("텔레그램을 통해 접속하셔야 참여가 가능합니다.");
      return;
    }

    try {
      const eventRef = doc(db, 'events', id);
      
      if (participating) {
        // 참여 취소
        await updateDoc(eventRef, {
          participants: arrayRemove({
            id: telegramUser.id,
            username: telegramUser.username || '',
            firstName: telegramUser.first_name || '',
            lastName: telegramUser.last_name || '',
            participatedAt: Timestamp.now()
          })
        });
        setParticipating(false);
      } else {
        // 참여 신청
        const participant = {
          id: telegramUser.id,
          username: telegramUser.username || '',
          firstName: telegramUser.first_name || '',
          lastName: telegramUser.last_name || '',
          participatedAt: Timestamp.now()
        };
        
        await updateDoc(eventRef, {
          participants: arrayUnion(participant)
        });
        
        // 댓글 추가
        await addComment("이벤트에 참여했습니다! 🎉");
        
        setParticipating(true);
      }
    } catch (error) {
      console.error("참여 처리 중 오류 발생:", error);
      alert("처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const addComment = async (text) => {
    if (!telegramUser) {
      alert("텔레그램을 통해 접속하셔야 댓글을 남길 수 있습니다.");
      return;
    }

    if (!text.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      const commentsRef = collection(db, 'events', id, 'comments');
      await addDoc(commentsRef, {
        text,
        userId: telegramUser.id,
        username: telegramUser.username || '',
        firstName: telegramUser.first_name || '',
        lastName: telegramUser.last_name || '',
        createdAt: Timestamp.now()
      });
      
      setComment('');
    } catch (error) {
      console.error("댓글 추가 중 오류 발생:", error);
      alert("댓글을 저장하는 중 오류가 발생했습니다.");
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    addComment(comment);
  };

  const drawWinners = async () => {
    if (!isAdmin) {
      alert("관리자만 추첨을 진행할 수 있습니다.");
      return;
    }

    if (!event.participants || event.participants.length === 0) {
      alert("참여자가 없어 추첨을 진행할 수 없습니다.");
      return;
    }

    try {
      // 당첨자 수 (이벤트 설정에서 가져오거나 기본값 사용)
      const winnerCount = event.winnerCount || 1;
      const participants = [...event.participants];
      
      if (participants.length <= winnerCount) {
        // 참여자가 당첨자 수보다 적으면 모두 당첨
        setWinners(participants);
        
        // Firestore 업데이트
        const eventRef = doc(db, 'events', id);
        await updateDoc(eventRef, {
          winners: participants,
          isActive: false,
          drawDate: Timestamp.now()
        });
      } else {
        // 무작위 당첨자 선정
        const selectedWinners = [];
        for (let i = 0; i < winnerCount; i++) {
          const randomIndex = Math.floor(Math.random() * participants.length);
          selectedWinners.push(participants[randomIndex]);
          participants.splice(randomIndex, 1);
        }
        
        setWinners(selectedWinners);
        
        // Firestore 업데이트
        const eventRef = doc(db, 'events', id);
        await updateDoc(eventRef, {
          winners: selectedWinners,
          isActive: false,
          drawDate: Timestamp.now()
        });
      }
      
      alert("추첨이 완료되었습니다!");
    } catch (error) {
      console.error("추첨 중 오류 발생:", error);
      alert("추첨 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return <div className="loading">이벤트 정보를 불러오는 중...</div>;
  }

  if (!event) {
    return <div className="error">이벤트를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="event-detail">
      <h1>{event.title}</h1>
      
      <div className="event-info">
        <p className="event-description">{event.description}</p>
        <div className="event-meta">
          <p>참여자: {event.participants?.length || 0}명</p>
          <p>상태: {event.isActive ? '진행중' : '종료됨'}</p>
          <p>마감일: {new Date(event.endDate.toDate()).toLocaleDateString()}</p>
          {event.drawDate && (
            <p>추첨일: {new Date(event.drawDate.toDate()).toLocaleDateString()}</p>
          )}
        </div>
      </div>
      
      {/* 참여 버튼 */}
      {event.isActive && telegramUser && (
        <button 
          className={`participate-btn ${participating ? 'cancel' : ''}`}
          onClick={handleParticipate}
        >
          {participating ? '참여 취소하기' : '이벤트 참여하기'}
        </button>
      )}
      
      {/* 관리자용 추첨 버튼 */}
      {isAdmin && event.isActive && (
        <button className="draw-btn" onClick={drawWinners}>
          당첨자 추첨하기
        </button>
      )}
      
      {/* 당첨자 발표 섹션 */}
      {winners.length > 0 && (
        <div className="winners-section">
          <h2>🎉 당첨자 발표 🎉</h2>
          <ul className="winners-list">
            {winners.map((winner, index) => (
              <li key={index} className="winner-item">
                {winner.username ? `@${winner.username}` : `${winner.firstName} ${winner.lastName}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 댓글 섹션 */}
      <div className="comments-section">
        <h2>댓글</h2>
        
        {telegramUser && (
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              disabled={!event.isActive}
            />
            <button type="submit" disabled={!event.isActive}>
              게시
            </button>
          </form>
        )}
        
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <strong>
                    {comment.username ? `@${comment.username}` : `${comment.firstName} ${comment.lastName}`}
                  </strong>
                  <span className="comment-time">
                    {new Date(comment.createdAt.toDate()).toLocaleString()}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="no-comments">아직 댓글이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;