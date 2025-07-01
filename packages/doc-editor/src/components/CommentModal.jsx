import React, { useState, useEffect } from 'react';

const CommentModal = ({ isOpen, onOk, onCancel, initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue || '');
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.25)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          minWidth: 320,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, marginBottom: 12 }}>添加评论</h3>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            resize: 'vertical',
            marginBottom: 16,
            fontSize: 15,
            padding: 8,
            outline: 'none',
          }}
          placeholder="请输入评论内容"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: '1px solid #ccc',
              background: '#f5f5f5',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={() => onOk(value)}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: '1px solid #0d6efd',
              background: '#0d6efd',
              color: '#fff',
              cursor: 'pointer',
            }}
            disabled={!value.trim()}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
