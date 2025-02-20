'use client'
import React, { useState, useEffect } from 'react'
import { Users, ListTodo, Trophy, Calendar } from 'lucide-react'
import { initTelegramWebApp } from '@/lib/telegram'
import { isAdminUser } from '@/config/admin';

// 유틸리티 함수들을 컴포넌트 밖으로 이동
const getCurrentDateTime = () => {
  // now 변수를 사용하지 않고 직접 new Date()를 사용
  const koreanTime = new Date(Date.now() + (9 * 60 * 60 * 1000)); // UTC+9
  const year = koreanTime.getFullYear();
  const month = String(koreanTime.getMonth() + 1).padStart(2, '0');
  const day = String(koreanTime.getDate()).padStart(2, '0');
  const hours = String(koreanTime.getHours()).padStart(2, '0');
  const minutes = String(koreanTime.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateTime = (dateString: string) => {
  const koreanTime = new Date(new Date(dateString).getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  const year = koreanTime.getFullYear();
  const month = String(koreanTime.getMonth() + 1).padStart(2, '0');
  const day = String(koreanTime.getDate()).padStart(2, '0');
  const hours = String(koreanTime.getHours()).padStart(2, '0');
  const minutes = String(koreanTime.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface Event {
  id: string;
  question: string;
  isActive: boolean;
  winnersCount: number;
  endDate: string;
  createdAt: string;
}

interface Response {
  id: string;
  eventId: string;
  userId: string;
  answer: string;
  createdAt: string;
}

interface Winner {
  userId: string;
  eventId: string;
  selectedAt: string;
}

const EventGame = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [newEvent, setNewEvent] = useState({
    question: '',
    winnersCount: 1,
    endDate: ''
  });
  const [selectedEventId, setSelectedEventId] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [userId, setUserId] = useState('');

  // 텔레그램 웹앱 초기화
  useEffect(() => {
    const webapp = initTelegramWebApp();
    
    if (webapp) {
      if (webapp.initDataUnsafe?.user) {
        const telegramUser = webapp.initDataUnsafe.user;
        const userId = telegramUser.id.toString();
        
        // userId 설정
        setUserId(userId);
        
        // 관리자 권한 체크
        setIsAdmin(isAdminUser(userId));
      }

      // 뒤로가기 버튼 핸들러
      webapp.BackButton.onClick(() => {
        if (selectedEvent) {
          handleSelectEvent(null);
        }
      });

      // MainButton 클릭 핸들러
      webapp.MainButton.onClick(() => {
        if (selectedEvent && userAnswer && selectedEventId) {
          handleSubmitResponse();
        }
      });

      return () => {
        const webapp = window.Telegram?.WebApp;
        if (webapp) {
          webapp.BackButton.offClick();
          webapp.MainButton.offClick();
        }
      };
    }
  }, []);

  // MainButton 상태 업데이트
  useEffect(() => {
    const webapp = window.Telegram?.WebApp;
    if (!webapp) return;
  
    // validateResponse 함수 정의
    const validateResponse = (eventId: string, userId: string): boolean => {
      const event = events.find(e => e.id === eventId);
      if (!event?.isActive) {
        alert('종료된 이벤트에는 답변할 수 없습니다.');
        return false;
      }
  
      const existingResponse = responses.find(
        r => r.eventId === eventId && r.userId === userId && r.id !== editingResponseId
      );
      
      if (existingResponse) {
        alert('이미 답변을 제출하셨습니다. 수정하시려면 답변 목록에서 수정 버튼을 클릭해주세요.');
        return false;
      }
  
      return true;
    };
  
    // generateId 함수 정의
    const generateId = () => {
      return Math.random().toString(36).substr(2, 9);
    };
  
    const handleSubmitResponse = () => {
      if (!selectedEventId || !userAnswer) {
        alert('답변을 입력해주세요.');
        return;
      }
  
      if (!validateResponse(selectedEventId, userId)) {
        return;
      }
  
      const event = events.find(e => e.id === selectedEventId);
      if (!event?.isActive) {
        alert('종료된 이벤트에는 답변할 수 없습니다.');
        return;
      }
  
      if (editingResponseId) {
        setResponses(prev => prev.map(response => 
          response.id === editingResponseId
            ? { ...response, answer: userAnswer, createdAt: getCurrentDateTime() }
            : response
        ));
        setEditingResponseId(null);
        alert('답변이 수정되었습니다.');
      } else {
        const hasAlreadyResponded = responses.some(
          response => response.eventId === selectedEventId && response.userId === userId
        );
  
        if (hasAlreadyResponded) {
          alert('이미 답변을 제출하셨습니다. 수정하시려면 답변 목록에서 수정 버튼을 클릭해주세요.');
          return;
        }
  
        const response = {
          id: generateId(),
          eventId: selectedEventId,
          userId,
          answer: userAnswer,
          createdAt: getCurrentDateTime()
        };
        
        setResponses(prev => [...prev, response]);
        alert('답변이 등록되었습니다.');
      }
  
      setUserAnswer('');
      setSelectedEventId('');
    };
  
    if (selectedEvent && !editingResponseId) {
      webapp.MainButton.setText('답변 제출하기');
      webapp.MainButton.show();
      webapp.MainButton.onClick(handleSubmitResponse);
    } else if (selectedEvent && editingResponseId) {
      webapp.MainButton.setText('답변 수정하기');
      webapp.MainButton.show();
      webapp.MainButton.onClick(handleSubmitResponse);
    } else {
      webapp.MainButton.hide();
    }
  
    return () => {
      webapp.MainButton.offClick();
    };
  }, [selectedEvent, editingResponseId, selectedEventId, userAnswer, userId, events, responses]);
  
  // 뒤로가기 버튼 상태 업데이트
  useEffect(() => {
    const webapp = window.Telegram?.WebApp;
    if (webapp) {
      if (selectedEvent) {
        webapp.BackButton.show();
      } else {
        webapp.BackButton.hide();
      }
    }
  }, [selectedEvent]);

  // 현재 시간 이후만 선택 가능하도록 최소 날짜 설정
  const minDateTime = getCurrentDateTime();

  const getFilteredEvents = () => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  
    switch (filter) {
      case 'active':
        return sortedEvents.filter(event => event.isActive);
      case 'ended':
        return sortedEvents.filter(event => !event.isActive);
      default:
        return sortedEvents;
    }
  };

  const getPaginatedEvents = () => {
    const filteredEvents = getFilteredEvents();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const totalPages = Math.ceil(getFilteredEvents().length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSelectEvent = (eventId: string | null) => {
    setSelectedEvent(eventId);
    setEditingEventId(null);
    setEditingResponseId(null);
  };

  const getEventResponses = (eventId: string) => {
    return responses.filter(response => response.eventId === eventId);
  };

  const handleStartEventEdit = (event: Event) => {
    setEditingEventId(event.id);
    setNewEvent({
      question: event.question,
      winnersCount: event.winnersCount,
      endDate: event.endDate
    });
  };

  const handleCancelEventEdit = () => {
    setEditingEventId(null);
    setNewEvent({ question: '', winnersCount: 1, endDate: '' });
  };

  const handleUpdateEvent = () => {
    if (!editingEventId) return;
    
    if (!newEvent.question || !newEvent.endDate) {
      alert('이벤트 질문과 종료일을 입력해주세요.');
      return;
    }
  
    setEvents(prev => prev.map(event => 
      event.id === editingEventId
        ? {
            ...event,
            question: newEvent.question,
            winnersCount: Math.max(1, newEvent.winnersCount),
            endDate: newEvent.endDate
          }
        : event
    ));
    
    setEditingEventId(null);
    setNewEvent({ question: '', winnersCount: 1, endDate: '' });
    alert('이벤트가 수정되었습니다.');
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!window.confirm('이벤트를 삭제하시겠습니까? 관련된 모든 답변도 함께 삭제됩니다.')) {
      return;
    }
  
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setResponses(prev => prev.filter(response => response.eventId !== eventId));
    setWinners(prev => prev.filter(winner => winner.eventId !== eventId));
    alert('이벤트가 삭제되었습니다.');
  };

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const getCurrentISOString = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const handleCreateEvent = () => {
    if (!newEvent.question || !newEvent.endDate) {
      alert('이벤트 질문과 종료일을 입력해주세요.');
      return;
    }

    const event: Event = {
      id: generateId(),
      question: newEvent.question,
      isActive: true,
      winnersCount: Math.max(1, newEvent.winnersCount),
      endDate: newEvent.endDate,
      createdAt: getCurrentISOString()
    };
    setEvents(prev => [...prev, event]);
    setNewEvent({ question: '', winnersCount: 1, endDate: '' });
  };

  const validateResponse = (eventId: string, userId: string): boolean => {
    const event = events.find(e => e.id === eventId);
    if (!event?.isActive) {
      alert('종료된 이벤트에는 답변할 수 없습니다.');
      return false;
    }
  
    const existingResponse = responses.find(
      r => r.eventId === eventId && r.userId === userId && r.id !== editingResponseId
    );
    
    if (existingResponse) {
      alert('이미 답변을 제출하셨습니다. 수정하시려면 답변 목록에서 수정 버튼을 클릭해주세요.');
      return false;
    }
  
    return true;
  };

  const handleSubmitResponse = () => {
    if (!selectedEventId || !userAnswer) {
      alert('답변을 입력해주세요.');
      return;
    }
  
    if (!validateResponse(selectedEventId, userId)) {
      return;
    }
  
    const event = events.find(e => e.id === selectedEventId);
    if (!event?.isActive) {
      alert('종료된 이벤트에는 답변할 수 없습니다.');
      return;
    }
  
    if (editingResponseId) {
      setResponses(prev => prev.map(response => 
        response.id === editingResponseId
          ? { ...response, answer: userAnswer, createdAt: getCurrentISOString() }
          : response
      ));
      setEditingResponseId(null);
      alert('답변이 수정되었습니다.');
    } else {
      const hasAlreadyResponded = responses.some(
        response => response.eventId === selectedEventId && response.userId === userId
      );

      if (hasAlreadyResponded) {
        alert('이미 답변을 제출하셨습니다. 수정하시려면 답변 목록에서 수정 버튼을 클릭해주세요.');
        return;
      }

      const response: Response = {
        id: generateId(),
        eventId: selectedEventId,
        userId,
        answer: userAnswer,
        createdAt: getCurrentISOString()
      };
      
      setResponses(prev => [...prev, response]);
      alert('답변이 등록되었습니다.');
    }
  
    setUserAnswer('');
    setSelectedEventId('');
  };

  const handleStartEdit = (response: Response) => {
    const event = events.find(e => e.id === response.eventId);
    if (!event?.isActive) {
      alert('종료된 이벤트의 답변은 수정할 수 없습니다.');
      return;
    }

    setEditingResponseId(response.id);
    setSelectedEventId(response.eventId);
    setUserAnswer(response.answer);
  };

  const handleEndEvent = (eventId: string) => {
    if (!window.confirm('이벤트를 종료하시겠습니까?')) return;

    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, isActive: false } : event
    ));
  };

  const handleSelectWinners = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (event.isActive) {
      alert('진행 중인 이벤트는 당첨자를 선정할 수 없습니다.');
      return;
    }

    const existingWinners = winners.filter(w => w.eventId === eventId);
    if (existingWinners.length > 0) {
      if (!window.confirm('이미 당첨자가 선정되었습니다. 다시 선정하시겠습니까?')) {
        return;
      }
      setWinners(prev => prev.filter(w => w.eventId !== eventId));
    }

    const eventResponses = responses.filter(r => r.eventId === eventId);
    if (eventResponses.length === 0) {
      alert('응답한 참가자가 없습니다.');
      return;
    }

    const selectedWinners: Winner[] = [];
    const availableResponses = [...eventResponses];
    
    while (selectedWinners.length < event.winnersCount && availableResponses.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableResponses.length);
      const response = availableResponses[randomIndex];
      
      selectedWinners.push({
        userId: response.userId,
        eventId: eventId,
        selectedAt: getCurrentISOString()
      });
      
      availableResponses.splice(randomIndex, 1);
    }

    setWinners(prev => [...prev, ...selectedWinners]);
    alert(`${selectedWinners.length}명의 당첨자가 선정되었습니다.`);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
  
    if (diff <= 0) return '종료됨';
  
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
    return `${days}일 ${hours}시간 ${minutes}분 남음`;
  };

  // 자동 이벤트 종료 체크
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setEvents(prev => prev.map(event => {
        if (event.isActive && new Date(event.endDate) <= now) {
          return { ...event, isActive: false };
        }
        return event;
      }));
    }, 60000); // 1분마다 체크

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* 뒤로가기 버튼 */}
        {selectedEvent && (
          <button
            onClick={() => handleSelectEvent(null)}
            className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← 목록으로 돌아가기
          </button>
        )}
   
        {/* 관리자 - 이벤트 등록 */}
        {isAdmin && !selectedEvent && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-lg transform transition-all hover:shadow-2xl">
            <h2 className="text-xl mb-4 font-bold flex items-center">
              <Calendar className="mr-2" />
              새 이벤트 등록
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={newEvent.question}
                  onChange={(e) => setNewEvent({ ...newEvent, question: e.target.value })}
                  placeholder="이벤트 질문 입력"
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                />
                <Trophy className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={newEvent.winnersCount}
                  onChange={(e) => setNewEvent({ ...newEvent, winnersCount: parseInt(e.target.value) || 1 })}
                  placeholder="당첨자 수"
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                />
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative">
                <input
                  type="datetime-local"
                  min={minDateTime}
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                  step="60"
                />
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={handleCreateEvent}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
              >
                <Trophy className="mr-2" />
                이벤트 등록
              </button>
            </div>
          </div>
        )}
   
        {!selectedEvent ? (
          // 이벤트 목록 보기
          <div>
            {/* 필터 UI */}
            <div className="mb-6 flex space-x-2 p-1 bg-gray-800 rounded-lg">
              {[
                { key: 'all', label: '전체', icon: ListTodo },
                { key: 'active', label: '진행중', icon: Users },
                { key: 'ended', label: '종료됨', icon: Calendar }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilter(key as 'all' | 'active' | 'ended');
                    setCurrentPage(1);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                    filter === key 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white transform scale-[1.02]' 
                      : 'bg-transparent text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
   
            {/* 이벤트 목록 */}
            <div className="space-y-4">
              {getPaginatedEvents().map(event => (
                <div 
                  key={event.id} 
                  className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-700"
                  onClick={() => handleSelectEvent(event.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        {event.question}
                      </h3>
                      <p className="text-sm text-gray-400 mt-2 flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        당첨자 수: {event.winnersCount} | 
                        <Calendar className="mx-2 h-4 w-4" />
                        {event.isActive ? getTimeRemaining(event.endDate) : '종료됨'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      event.isActive 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    }`}>
                      {event.isActive ? '진행중' : '종료됨'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-400 flex items-center">
                      <ListTodo className="mr-2 h-4 w-4" />
                      답변 {getEventResponses(event.id).length}개
                    </p>
                    {winners.filter(w => w.eventId === event.id).length > 0 && (
                      <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full">
                        <p className="text-sm font-medium">
                          🎉 당첨자 {winners.filter(w => w.eventId === event.id).length}명
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
   
            {/* 페이지네이션 UI */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  이전
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        ) : (
          // 이벤트 상세 보기
          <div className="space-y-4">
            {events.map(event => event.id === selectedEvent && (
              <div key={event.id} className="bg-gray-800 rounded-lg">
                {editingEventId === event.id ? (
                  // 수정 폼
                  <div className="p-4 space-y-4">
                    <input
                      type="text"
                      value={newEvent.question}
                      onChange={(e) => setNewEvent({ ...newEvent, question: e.target.value })}
                      placeholder="이벤트 질문 입력"
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min="1"
                      value={newEvent.winnersCount}
                      onChange={(e) => setNewEvent({ ...newEvent, winnersCount: parseInt(e.target.value) || 1 })}
                      placeholder="당첨자 수"
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="datetime-local"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateEvent}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        수정 완료
                      </button>
                      <button
                        onClick={handleCancelEventEdit}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  // 이벤트 상세 내용
                  <div>
                    <div className="p-4 border-b border-gray-700">
                      <h2 className="text-2xl font-bold">{event.question}</h2>
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-sm text-gray-400">
                          생성일: {formatDateTime(event.createdAt)}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          event.isActive ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {event.isActive ? '진행중' : '종료됨'}
                        </span>
                      </div>
                      <div className="mt-2 text-gray-400">
                        <p>당첨자 수: {event.winnersCount}명</p>
                        <p>{event.isActive ? getTimeRemaining(event.endDate) : '종료된 이벤트'}</p>
                      </div>
                    </div>
   
                    {/* 관리자 버튼 */}
                    {isAdmin && (
                      <div className="p-4 border-b border-gray-700 flex space-x-2">
                        {event.isActive ? (
                          <>
                            <button
                              onClick={() => handleStartEventEdit(event)}
                              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleEndEvent(event.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                              이벤트 종료
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleSelectWinners(event.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          >
                            당첨자 선정
                          </button>
                        )}
                        {/* 삭제 버튼은 항상 표시 */}
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    )}
   
                    {/* 당첨자 목록 */}
                    {winners.filter(w => w.eventId === event.id).length > 0 && (
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="text-lg font-medium mb-2">🎉 당첨자 목록</h3>
                        <ul className="space-y-2">
                          {winners
                            .filter(w => w.eventId === event.id)
                            .map(winner => (
                              <li key={winner.userId} className="text-green-400">
                                {winner.userId} (당첨 시각: {formatDateTime(winner.selectedAt)})
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
   
                    {/* 답변 입력 폼 */}
                    {!isAdmin && event.isActive && (
                      <div className="p-4 border-b border-gray-700">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={selectedEventId === event.id ? userAnswer : ''}
                            onChange={(e) => {
                              setSelectedEventId(event.id);
                              setUserAnswer(e.target.value);
                            }}
                            placeholder="답변 입력"
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleSubmitResponse}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          >
                            {editingResponseId ? '답변 수정하기' : '답변 제출'}
                          </button>
                        </div>
                      </div>
                    )}
   
                    {/* 답변 목록 */}
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-4">답변 목록</h3>
                      <div className="space-y-4">
                        {getEventResponses(event.id).map(response => (
                          <div key={response.id} className="p-4 bg-gray-700 rounded-lg">
                            <div className="flex justify-between items-start">
                              <p className="text-sm text-gray-400">작성자: {response.userId}</p>
                              <p className="text-sm text-gray-400">
                                {formatDateTime(response.createdAt)}
                              </p>
                            </div>
                            <p className="mt-2">{response.answer}</p>
                            {!isAdmin && response.userId === userId && event.isActive && (
                              <div className="mt-4">
                                <button
                                  onClick={() => handleStartEdit(response)}
                                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                                >
                                  답변 수정
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventGame;