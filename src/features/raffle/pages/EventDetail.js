import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, updateDoc, arrayUnion, deleteDoc,
  onSnapshot, Timestamp, collection, addDoc, writeBatch, increment
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { getUserDocument } from '../../../utils/userUtils';
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
  const [userPoints, setUserPoints] = useState(0);
  const [processing, setProcessing] = useState(false);

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
  const [editEntryFee, setEditEntryFee] = useState(0); // 추가: 참여 비용 수정

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
    setEditEntryFee(event.entryFee || 0); // 추가: 참여 비용
    
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

    // 참여 비용이 음수인지 확인
    if (editEntryFee < 0) {
      alert("참여 비용은 0 CGP 이상이어야 합니다.");
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
        entryFee: Number(editEntryFee), // 추가: 참여 비용
        updatedAt: Timestamp.now() // 수정 시간 추가
      });
      
      alert("이벤트가 수정되었습니다.");
      setIsEditing(false); // 수정 모드 종료
    } catch (error) {
      console.error("이벤트 수정 중 오류 발생:", error);
      alert("이벤트 수정 중 오류가 발생했습니다.");
    }
  };

  // 사용자 정보 및 포인트 불러오기 로직
  useEffect(() => {
    const fetchUserData = async () => {
      if (telegramUser?.id) {
        try {
          const userData = await getUserDocument(telegramUser);
          if (userData) {
            setUserPoints(userData.points || 0);
          }
        } catch (error) {
          console.error("사용자 데이터 불러오기 오류:", error);
        }
      }
    };
    
    fetchUserData();
  }, [telegramUser]);

  // 댓글 작성 시 참여 함수
  const addComment = async (text) => {
    if (!telegramUser) {
      alert("텔레그램을 통해 접속하셔야 댓글을 남길 수 있습니다.");
      return;
    }

    if (!text.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }
    
    // 참여 비용 확인
    const entryFee = event.entryFee || 0;
    
    // 참여 비용이 있고, 사용자 포인트가 부족한 경우
    if (entryFee > 0 && userPoints < entryFee) {
      alert(`참여 비용 ${entryFee} CGP가 부족합니다. 현재 보유 CGP: ${userPoints}`);
      return;
    }
    
    // 이미 참여 중인지 확인
    const isAlreadyParticipating = event.participants?.some(p => p.id === telegramUser.id);
    
    if (isAlreadyParticipating) {
      // 이미 참여한 경우 댓글만 추가
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
      return;
    }
    
    // 처음 참여하는 경우 비용 지불 및 참여 처리
    setProcessing(true);
    
    try {
      // 배치 처리로 트랜잭션 구현
      const batch = writeBatch(db);
      
      // 1. 댓글 추가
      const commentsRef = collection(db, 'events', id, 'comments');
      const commentRef = doc(commentsRef);
      batch.set(commentRef, {
        text,
        userId: telegramUser.id,
        username: telegramUser.username || '',
        firstName: telegramUser.first_name || '',
        lastName: telegramUser.last_name || '',
        createdAt: Timestamp.now()
      });
      
      // 2. 참여자 추가
      const eventRef = doc(db, 'events', id);
      const participant = {
        id: telegramUser.id,
        username: telegramUser.username || '',
        firstName: telegramUser.first_name || '',
        lastName: telegramUser.last_name || '',
        participatedAt: Timestamp.now(),
        paidFee: entryFee
      };
      
      batch.update(eventRef, {
        participants: arrayUnion(participant),
        totalPool: increment(entryFee) // 총 상금 풀 증가
      });
      
      // 3. 사용자 포인트 차감 (참여 비용이 있는 경우)
      if (entryFee > 0) {
        const userRef = doc(db, 'users', telegramUser.id.toString());
        batch.update(userRef, {
          points: increment(-entryFee),
          updatedAt: Timestamp.now()
        });
      }
      
      // 배치 실행
      await batch.commit();
      
      // 상태 업데이트
      if (entryFee > 0) {
        setUserPoints(prev => prev - entryFee);
      }
      
      setParticipating(true);
      setComment('');
      
      // 화면에 보이는 참여자 수 업데이트를 위해 이벤트 다시 불러오기
      const updatedEventDoc = await getDoc(eventRef);
      if (updatedEventDoc.exists()) {
        setEvent(updatedEventDoc.data());
      }
      
    } catch (error) {
      console.error("이벤트 참여 처리 오류:", error);
      alert("이벤트 참여 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
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
      
      // 총 상금 풀 계산
      const totalPool = event.totalPool || 0;
      
      // 당첨자 별 상금 계산 (동일하게 나눔)
      const prizePerWinner = selectedWinners.length > 0 
        ? Math.floor(totalPool / selectedWinners.length) 
        : 0;
      
      // 배치 처리
      const batch = writeBatch(db);
      
      // 1. 이벤트 상태 업데이트
      const eventRef = doc(db, 'events', id);
      
      // 당첨자 정보에 상금 정보 추가
      const winnersWithPrize = selectedWinners.map(winner => ({
        ...winner,
        prize: prizePerWinner
      }));
      
      batch.update(eventRef, {
        winners: winnersWithPrize,
        isActive: false,
        drawDate: Timestamp.now()
      });
      
      // 2. 당첨자들에게 상금 지급
      if (prizePerWinner > 0) {
        for (const winner of selectedWinners) {
          const userRef = doc(db, 'users', winner.id.toString());
          
          // 사용자 문서 확인
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            // 상금 지급
            batch.update(userRef, {
              points: increment(prizePerWinner),
              updatedAt: Timestamp.now(),
              rewardHistory: arrayUnion({
                type: 'raffle_win',
                amount: prizePerWinner,
                date: new Date().toISOString(),
                description: `래플 이벤트 '${event.title}' 당첨 상금`
              })
            });
          }
        }
      }
      
      // 배치 실행
      await batch.commit();
      
      setWinners(winnersWithPrize);
      
      // 상금이 있는 경우와 없는 경우 메시지 분리
      if (totalPool > 0) {
        alert(`당첨자 추첨이 완료되었습니다!\n각 당첨자에게 ${prizePerWinner} CGP의 상금이 지급되었습니다.`);
      } else {
        alert("당첨자 추첨이 완료되었습니다!");
      }
      
    } catch (error) {
      console.error("추첨 중 오류 발생:", error);
      alert("추첨 중 오류가 발생했습니다.");
    }
  };

  // 이벤트 마감 여부 확인 함수 (useCallback으로 래핑)
  const checkEventStatus = useCallback(async () => {
    if (!event || !event.isActive) return;
    
    const now = new Date();
    const endDate = event.endDate?.toDate();
    
    if (!endDate) return;
    
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
  }, [event, id]);

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
  
  // 이벤트 데이터가 로드된 후 상태 확인 (useEffect 의존성 배열 수정)
  useEffect(() => {
    if (event) {
      checkEventStatus();
      
      // 1분마다 이벤트 상태 확인 (마감 시간 체크)
      const intervalId = setInterval(checkEventStatus, 60000);
      return () => clearInterval(intervalId);
    }
  }, [event, checkEventStatus]); // checkEventStatus 의존성 추가

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
            
            <div className="form-group">
              <label htmlFor="editEntryFee">참여 비용 (CGP)</label>
              <input
                type="number"
                id="editEntryFee"
                value={editEntryFee}
                onChange={(e) => setEditEntryFee(e.target.value)}
                min={0}
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
              {event.entryFee > 0 && (
                <p className="event-fee">참여 비용: {event.entryFee} CGP</p>
              )}
              <p className={`event-status ${event.isActive ? 'active' : 'ended'}`}>
                상태: {event.isActive ? '진행중' : '종료됨'}
              </p>
              <p>마감일: <br/> {new Date(event.endDate.toDate()).toLocaleDateString()} {new Date(event.endDate.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              {event.drawDate && (
                <p>추첨일: <br/> {new Date(event.drawDate.toDate()).toLocaleDateString()} {new Date(event.drawDate.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              )}
              {event.totalPool > 0 && (
                <p className="event-pool">총 상금: {event.totalPool} CGP</p>
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
          
          {event.totalPool > 0 && (
            <p className="winners-prize-info">
              총 상금: {event.totalPool} CGP
              {winners.length > 0 && (
                <span> (1인당 {Math.floor(event.totalPool / winners.length)} CGP)</span>
              )}
            </p>
          )}
          
          <ul className="winners-list">
            {winners.map((winner, index) => (
              <li key={index} className="winner-item">
                {winner.username 
                  ? `@${winner.username}` 
                  : `${winner.firstName} ${winner.lastName}`}
                {winner.prize > 0 && (
                  <span className="winner-prize"> +{winner.prize} CGP</span>
                )}
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
          {event.entryFee > 0 && !participating && ` 참여 비용은 ${event.entryFee} CGP입니다.`}
          {!event.isActive && ' 이벤트가 종료되어 더 이상 참여할 수 없습니다.'}
        </p>
        
        {telegramUser && (
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={event.isActive 
                ? (participating 
                    ? "댓글을 입력하세요..." 
                    : `${event.entryFee > 0 ? `${event.entryFee} CGP를 지불하고 ` : ''}참여하려면 댓글을 입력하세요...`)
                : "이벤트가 종료되었습니다"}
              disabled={!event.isActive || processing}
            />
            <button 
              type="submit" 
              disabled={!event.isActive || processing}
            >
              {processing 
                ? "처리 중..." 
                : participating 
                  ? "댓글 작성" 
                  : "참여하기"}
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