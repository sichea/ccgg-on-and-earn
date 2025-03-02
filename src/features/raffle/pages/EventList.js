import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import './EventList.css';

const Home = ({ telegramUser, isAdmin }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsQuery = query(
          collection(db, 'events'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(eventsQuery);
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setEvents(eventsList);
        setLoading(false);
      } catch (error) {
        console.error('이벤트를 불러오는 중 오류 발생:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="home-container">
      <h1>래플 이벤트</h1>
      
      {isAdmin && (
        <div className="admin-actions">
          <Link to="/create" className="create-btn">
            새 이벤트 만들기
          </Link>
        </div>
      )}
      
      {loading ? (
        <div className="loading">이벤트 목록을 불러오는 중...</div>
      ) : (
        <div className="events-list">
          {events.length > 0 ? (
            events.map(event => (
              <Link to={`/event/${event.id}`} key={event.id} className="event-card">
                <h2>{event.title}</h2>
                <p className="event-description">{event.description.substring(0, 100)}...</p>
                <div className="event-meta">
                  <span>참여자: {event.participants?.length || 0}명</span>
                  <span className={`event-status ${event.isActive ? 'active' : 'ended'}`}>
                    {event.isActive ? '진행중' : '종료됨'}
                  </span>
                </div>
                <p className="event-deadline">
                  마감: {new Date(event.endDate.toDate()).toLocaleDateString()}
                </p>
              </Link>
            ))
          ) : (
            <div className="no-events">
              현재 진행 중인 이벤트가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;