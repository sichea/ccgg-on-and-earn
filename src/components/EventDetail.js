import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc,
  onSnapshot, Timestamp, collection, addDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import './EventDetail.css';

const EventDetail = ({ telegramUser, isAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [winners, setWinners] = useState([]);
  const [participating, setParticipating] = useState(false);

  // 이벤트 삭제 함수
  const deleteEvent = async () => {
    if (!isAdmin) {
      alert("관리자만 이벤트를 삭제할 수 있습니다.");
      return;
    }

    const confirmDelete = window.confirm(
      "정말로 이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmDelete) {
      return;
    }

    try {
      // 이벤트 문서 삭제
      await deleteDoc(doc(db, 'events', id));
      alert("이벤트가 삭제되었습니다.");
      navigate('/'); // 삭제 후 홈으로 이동
    } catch (error) {
      console.error("이벤트 삭제 중 오류 발생:", error);
      alert("이벤트 삭제 중 오류가 발생했습니다.");
    }
  };

  // 수정 모드 상태 관리
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editWinnerCount, setEditWinnerCount] = useState(1);

  // 수정 모드 시작
  const startEditing = () => {
    if (!isAdmin) {
      alert("관리자만 이벤트를 수정할 수 있습니다.");
      return;
    }

    // 기존 이벤트 정보로 수정 폼 초기화
    setEditTitle(event.title);
    setEditDescription(event.description);
    
    // 날짜 형식 변환
    const endDate = event.endDate.toDate();
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    const hours = String(endDate.getHours()).padStart(2, '0');
    const minutes = String(endDate.getMinutes()).padStart(2, '0');
    
    setEditEndDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    setEditWinnerCount(event.winnerCount || 1);
    
    setIsEditing(true);
  };

  // 수정 취소
  const cancelEditing = () => {
    setIsEditing(false);
  };

  // 이벤트 업데이트
  const updateEvent = async (e) => {
    e.preventDefault();
    
    if (!editTitle.trim() || !editDescription.trim() || !editEndDate) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    try {
      const selectedDate = new Date(editEndDate);
      
      // Firestore 업데이트
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        title: editTitle,
        description: editDescription,
        endDate: Timestamp.fromDate(selectedDate),
        winnerCount: Number(editWinnerCount),
        updatedAt: Timestamp.now() // 수정 시간 추가
      });
      
      alert("이벤트가 수정되었습니다.");
      setIsEditing(false); // 수정 모드 종료
    } catch (error) {
      console.error("이벤트 수정 중 오류 발생:", error);
      alert("이벤트 수정 중 오류가 발생했습니다.");
    }
  };

  // 댓글 작성을 통해 자동으로 참여하도록 변경
  const addParticipant = async (userId, username, firstName, lastName) => {
    try {
      const eventRef = doc(db, 'events', id);
      
      // 이미 참여 중인지 확인
      const isAlreadyParticipating = event.participants?.some(p => p.id === userId);
      
      // 아직 참여하지 않았다면 참여자 목록에 추가
      if (!isAlreadyParticipating) {
        const participant = {
          id: userId,
          username: username || '',
          firstName: firstName || '',
          lastName: lastName || '',
          participatedAt: Timestamp.now()
        };
        
        await updateDoc(eventRef, {
          participants: arrayUnion(participant)
        });
        
        // 참여 상태 업데이트
        if (userId === telegramUser?.id) {
          setParticipating(true);
        }
      }
    } catch (error) {
      console.error("참여자 추가 중 오류 발생:", error);
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
      
      // 댓글 작성시 자동으로 참여자 목록에 추가
      await addParticipant(
        telegramUser.id, 
        telegramUser.username, 
        telegramUser.first_name, 
        telegramUser.last_name
      );
      
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

    if (!comments || comments.length === 0) {
      alert("댓글 작성자가 없어 추첨을 진행할 수 없습니다.");
      return;
    }
    
    // 이미 당첨자가 있는지 확인
    if (winners && winners.length > 0) {
      const confirmRedraw = window.confirm("이미 당첨자가 선정되었습니다. 다시 추첨하시겠습니까?");
      if (!confirmRedraw) {
        return;
      }
    }

    try {
      // 당첨자 수 (이벤트 설정에서 가져오거나 기본값 사용)
      const winnerCount = event.winnerCount || 1;
      
      // 댓글 작성자 중에서 중복 없이 사용자 목록 추출
      const uniqueCommenters = [];
      const userIds = new Set();
      
      comments.forEach(comment => {
        if (!userIds.has(comment.userId)) {
          userIds.add(comment.userId);
          uniqueCommenters.push({
            id: comment.userId,
            username: comment.username || '',
            firstName: comment.firstName || '',
            lastName: comment.lastName || '',
            participatedAt: comment.createdAt
          });
        }
      });
      
      if (uniqueCommenters.length === 0) {
        alert("유효한 댓글 작성자가 없습니다.");
        return;
      }
      
      let selectedWinners = [];
      
      if (uniqueCommenters.length <= winnerCount) {
        // 댓글 작성자가 당첨자 수보다 적으면 모두 당첨
        selectedWinners = [...uniqueCommenters];
      } else {
        // 무작위 당첨자 선정
        const commenters = [...uniqueCommenters];
        for (let i = 0; i < winnerCount; i++) {
          const randomIndex = Math.floor(Math.random() * commenters.length);
          selectedWinners.push(commenters[randomIndex]);
          commenters.splice(randomIndex, 1);
        }
      }
      
      setWinners(selectedWinners);
      
      // Firestore 업데이트
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        winners: selectedWinners,
        isActive: false,
        drawDate: Timestamp.now()
      });
      
      alert("댓글 작성자 중에서 당첨자 추첨이 완료되었습니다!");
    } catch (error) {
      console.error("추첨 중 오류 발생:", error);
      alert("추첨 중 오류가 발생했습니다.");
    }
  };

  // 이벤트 마감 여부 확인 함수
  const checkEventStatus = async () => {
    if (!event || !event.isActive) return;
    
    const now = new Date();
    const endDate = event.endDate.toDate();
    
    // 현재 시간이 마감 시간을 지났는지 확인
    if (now > endDate && event.isActive) {
      try {
        // 이벤트 상태 업데이트
        const eventRef = doc(db, 'events', id);
        await updateDoc(eventRef, {
          isActive: false
        });
        
        // 화면에 표시되는 이벤트 상태 업데이트
        setEvent({
          ...event,
          isActive: false
        });
      } catch (error) {
        console.error("이벤트 상태 업데이트 중 오류 발생:", error);
      }
    }
  };

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
  
  // 이벤트 데이터가 로드된 후 상태 확인
  useEffect(() => {
    if (event) {
      checkEventStatus();
      
      // 1분마다 이벤트 상태 확인 (마감 시간 체크)
      const intervalId = setInterval(checkEventStatus, 60000);
      return () => clearInterval(intervalId);
    }
  }, [event]);

  if (loading) {
    return <div className="loading">이벤트 정보를 불러오는 중...</div>;
  }

  if (!event) {
    return <div className="error">이벤트를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="event-detail">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← 이벤트 목록으로 돌아가기
        </button>
      </div>
      
      {/* 관리자 액션 버튼 */}
      {isAdmin && !isEditing && (
        <div className="admin-actions">
          <button className="edit-btn" onClick={startEditing}>이벤트 수정</button>
          <button className="delete-btn" onClick={deleteEvent}>이벤트 삭제</button>
        </div>
      )}
      
      {isEditing ? (
        // 수정 폼
        <div className="edit-event-form">
          <h2>이벤트 수정</h2>
          <form onSubmit={updateEvent}>
            <div className="form-group">
              <label htmlFor="editTitle">이벤트 제목 *</label>
              <input
                type="text"
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="editDescription">이벤트 설명 *</label>
              <textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
                rows={5}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="editEndDate">마감일 *</label>
              <input
                type="datetime-local"
                id="editEndDate"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="editWinnerCount">당첨자 수</label>
              <input
                type="number"
                id="editWinnerCount"
                value={editWinnerCount}
                onChange={(e) => setEditWinnerCount(e.target.value)}
                min={1}
                max={100}
              />
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={cancelEditing}>
                취소
              </button>
              <button type="submit" className="submit-btn">
                저장하기
              </button>
            </div>
          </form>
        </div>
      ) : (
        // 일반 이벤트 보기
        <>
          <h1>{event.title}</h1>
          
          <div className="event-info">
            <p className="event-description">{event.description}</p>
            <div className="event-meta">
              <p>참여자: {event.participants?.length || 0}명</p>
              <p className={`event-status ${event.isActive ? 'active' : 'ended'}`}>
                상태: {event.isActive ? '진행중' : '종료됨'}
              </p>
              <p>마감일: {new Date(event.endDate.toDate()).toLocaleDateString()} {new Date(event.endDate.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              {event.drawDate && (
                <p>추첨일: {new Date(event.drawDate.toDate()).toLocaleDateString()} {new Date(event.drawDate.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              )}
            </div>
            
            {!event.isActive && !winners.length && (
              <div className="event-ended-notice">
                <p>이벤트가 종료되었습니다. 곧 당첨자 발표가 있을 예정입니다.</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* 관리자용 추첨 버튼 - 이벤트가 종료되어도 당첨자가 없다면 추첨 버튼 표시 */}
      {isAdmin && !isEditing && (!event.winners || event.winners.length === 0) && (
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
        <h2>댓글 작성하기</h2>
        <p className="comment-info">
          댓글을 작성하시면 자동으로 이벤트에 참여됩니다. 
          {!event.isActive && ' 이벤트가 종료되어 더 이상 참여할 수 없습니다.'}
        </p>
        
        {telegramUser && (
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={event.isActive ? "댓글을 입력하세요..." : "이벤트가 종료되었습니다"}
              disabled={!event.isActive}
            />
            <button type="submit" disabled={!event.isActive}>
              참여하기
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