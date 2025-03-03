import React from 'react';

const FriendList = ({ friends }) => {
  return (
    <div className="friend-list-container">
      <div className="friend-list-header">
        <h2 className="friend-list-title">Friend List</h2>
        <span className="friend-list-count">{friends.length}</span>
      </div>
      
      {friends.length === 0 ? (
        <div className="friend-empty-message">
          <p>You don't have any friends yet.</p>
          <p>Invite your friends now!</p>
        </div>
      ) : (
        <div className="friend-list">
          {friends.map((friend, index) => (
            <div key={index} className="friend-item">
              <span className="friend-name">{friend.name}</span>
              <span className="friend-status">{friend.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendList;