import React from 'react';

/**
 * 协同连接状态指示器组件
 * 显示连接状态和文档ID，用于验证文档隔离
 */
const StatusIndicator = ({ isConnected, documentId }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        borderRadius: '50%',
        width: '16px',
        height: '16px',
        backgroundColor: isConnected ? '#4caf50' : '#f44336',
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0 6px',
        cursor: 'pointer',
      }}
      title={
        isConnected ? `已连接 (文档ID: ${documentId})` : '未连接到协同服务'
      }
    >
      <span
        style={{
          position: 'absolute',
          color: 'white',
          fontSize: '10px',
          right: '-12px',
          top: '-12px',
          background: '#333',
          padding: '2px 4px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          display: 'none',
        }}
        className="status-tooltip"
      >
        {isConnected ? `已连接 (${documentId})` : '未连接到协同服务'}
      </span>
    </div>
  );
};

export default StatusIndicator;
