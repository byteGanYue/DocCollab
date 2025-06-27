import React from 'react';

const StatusIndicator = ({ isConnected }) => (
  <div
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: isConnected ? '#2e7d32' : '#c62828',
      color: 'white',
      fontSize: '12px',
      zIndex: 20,
    }}
  >
    {isConnected ? '协同模式' : '本地模式'}
  </div>
);

export default StatusIndicator;
