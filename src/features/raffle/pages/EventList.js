import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import './EventList.css';

const EventList = ({ telegramUser, isAdmin }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'ended'
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5; // 페이지당 이벤트 수

  // 모든 이벤트를 먼저 가져오고, 클라이언트 측에서 필터링
  useEffect(() => {
    fetchAllEvents();
  }, []);
  
  // 필터가 변경될 때 이벤트 필터링
  useEffect(() => {
    filterEvents();
  }, [activeFilter, events]);

  // 모든 이벤트 가져오기
  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      
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
  
  // 이벤트 필터링 (클라이언트 측)
  const filterEvents = () => {
    const now = new Date();
    
    if (activeFilter === 'all') {
      setFilteredEvents(events);
    } 
    else if (activeFilter === 'active') {
      // 진행중 조건: isActive가 true이고 endDate가 현재 시간보다 나중
      const activeEvents = events.filter(event => {
        const endDate = event.endDate.toDate();
        return event.isActive === true && endDate > now;
      });
      setFilteredEvents(activeEvents);
    } 
    else if (activeFilter === 'ended') {
      // 종료됨 조건: isActive가 false이거나 endDate가 현재 시간보다 이전
      const endedEvents = events.filter(event => {
        const endDate = event.endDate.toDate();
        return event.isActive === false || endDate <= now;
      });
      setFilteredEvents(endedEvents);
    }
    
    // 필터 변경 시 첫 페이지로 리셋
    setCurrentPage(1);
  };

  // 현재 페이지의 이벤트만 가져오기
  const getCurrentEvents = () => {
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    return filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  // 페이지 변경 함수
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

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
      
      {/* 필터 탭 */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          전체
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => setActiveFilter('active')}
        >
          진행중
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'ended' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ended')}
        >
          종료됨
        </button>
      </div>
      
      {loading ? (
        <div className="loading">이벤트 목록을 불러오는 중...</div>
      ) : (
        <div className="events-list">
          {getCurrentEvents().length > 0 ? (
            getCurrentEvents().map(event => {
              // 이벤트 마감 상태 확인 (UI 표시용)
              const endDate = event.endDate.toDate();
              const isExpired = endDate <= new Date();
              const displayStatus = event.isActive && !isExpired ? '진행중' : '종료됨';
              const statusClass = event.isActive && !isExpired ? 'active' : 'ended';
              
              return (
                <Link to={`/event/${event.id}`} key={event.id} className="event-card">
                  <h2>{event.title}</h2>
                  <p className="event-description">
                    {event.description.length > 100 
                      ? `${event.description.substring(0, 100)}...` 
                      : event.description}
                  </p>
                  <div className="event-meta">
                    <span>참여자: {event.participants?.length || 0}명</span>
                    <span className={`event-status ${statusClass}`}>
                      {displayStatus}
                    </span>
                  </div>
                  <p className="event-deadline">
                    마감: {new Date(event.endDate.toDate()).toLocaleDateString()} {new Date(event.endDate.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="no-events">
              {activeFilter === 'all' ? '이벤트가 없습니다.' : 
               activeFilter === 'active' ? '진행 중인 이벤트가 없습니다.' : 
               '종료된 이벤트가 없습니다.'}
            </div>
          )}
        </div>
      )}
      
      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-arrow" 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          
          <div className="pagination-info">
            {currentPage} / {totalPages}
          </div>
          
          <button 
            className="pagination-arrow" 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default EventList;