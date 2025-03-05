import React from 'react';

const FriendList = ({ friends }) => {
  // friends 배열이 undefined인 경우 빈 배열로 처리
  const friendsList = Array.isArray(friends) ? friends : [];
  
  // 친구 이름 표시 함수
  const getFriendName = (friend) => {
    if (friend.username) {
      return `@${friend.username}`;
    } else if (friend.firstName) {
      return `${friend.firstName} ${friend.lastName || ''}`.trim();
    } else {
      return `사용자 ${friend.userId}`;
    }
  };

  return (
    <div className="friend-list-container">
      <div className="friend-list-header">
        <h2 className="friend-list-title">Friend List</h2>
        <span className="friend-list-count">{friendsList.length}</span>
      </div>
      
      {friendsList.length === 0 ? (
        <div className="friend-empty-message">
          <p>You don't have any friends yet.</p>
          <p>Invite your friends now!</p>
        </div>
      ) : (
        <div className="friend-list">
          {friendsList.map((friend, index) => (
            <div key={index} className="friend-item">
              <span className="friend-name">{getFriendName(friend)}</span>
              <span className="friend-status">{friend.status || 'active'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendList;