import React from 'react';

const UserAvatars = ({ isConnected, onlineUsers, remoteUsers }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: isConnected ? '#2e7d32' : '#c62828',
    }}
  >
    <span className="material-icons" style={{ fontSize: '16px' }}>
      {isConnected ? 'group' : 'person'}
    </span>
    <span>{isConnected ? `${onlineUsers}人在线` : '离线编辑'}</span>
    {isConnected && (
      <div style={{ marginLeft: '10px', display: 'flex', gap: '4px' }}>
        {remoteUsers.map(({ clientId, user }) => (
          <div
            key={clientId}
            title={user?.name || '匿名用户'}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: user?.color || '#ccc',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            {(user?.name || '?').charAt(0)}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default UserAvatars;
