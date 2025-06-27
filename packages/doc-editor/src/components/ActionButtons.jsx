import React from 'react';

const ActionButtons = ({ onCancel, onSave, onAI, onHelp }) => (
  <div
    style={{
      display: 'flex',
      gap: '12px',
    }}
  >
    <button
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        backgroundColor: '#f8f9fa',
        color: '#6c757d',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        outline: 'none',
        minWidth: '80px',
      }}
      onClick={onCancel}
    >
      取消
    </button>
    <button
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #0d6efd',
        borderRadius: '6px',
        backgroundColor: '#0d6efd',
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        outline: 'none',
        minWidth: '80px',
      }}
      onClick={onSave}
    >
      保存
    </button>
    <button
      onClick={onAI}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #6610f2',
        borderRadius: '6px',
        backgroundColor: '#6610f2',
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        outline: 'none',
        minWidth: '80px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      AI摘要
    </button>
    <button
      onClick={onHelp}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #6c757d',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        color: '#6c757d',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        outline: 'none',
        minWidth: '80px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span className="material-icons" style={{ fontSize: '16px' }}>
        help_outline
      </span>
      使用说明
    </button>
  </div>
);

export default ActionButtons;
