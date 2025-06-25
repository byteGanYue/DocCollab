import React from 'react';

/**
 * 工具栏按钮组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.active - 是否激活状态
 * @param {React.ReactNode} props.children - 子组件
 * @param {Function} props.onMouseDown - 鼠标按下事件处理函数
 */
const Button = ({ active, children, onMouseDown }) => {
  return (
    <span
      onMouseDown={onMouseDown}
      style={{
        cursor: 'pointer',
        color: active ? '#fff' : '#666',
        backgroundColor: active ? '#007acc' : 'transparent',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid',
        borderColor: active ? '#007acc' : '#ddd',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '32px',
        height: '32px',
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.target.style.backgroundColor = '#f5f5f5';
          e.target.style.borderColor = '#bbb';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.borderColor = '#ddd';
        }
      }}
    >
      {children}
    </span>
  );
};

export default Button;
