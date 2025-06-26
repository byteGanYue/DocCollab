import React from 'react';

/**
 * 工具栏按钮组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.active - 是否激活状态
 * @param {React.ReactNode} props.children - 子组件
 * @param {Function} props.onMouseDown - 鼠标按下事件处理函数
 * @param {Object} props.style - 自定义样式
 * @param {boolean} props.reversed - 是否为反色模式（用于悬浮工具栏）
 */
const Button = ({
  active,
  children,
  onMouseDown,
  style,
  reversed,
  ...props
}) => {
  // 默认样式
  const defaultStyle = {
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
  };

  // 悬浮工具栏反色模式样式
  const reversedStyle = {
    ...defaultStyle,
    color: active ? '#222' : '#ccc',
    backgroundColor: active ? '#fff' : 'transparent',
    border: 'none',
    borderRadius: '3px',
    padding: '6px 8px',
    minWidth: '28px',
    height: '28px',
  };

  // 合并样式
  const finalStyle = {
    ...(reversed ? reversedStyle : defaultStyle),
    ...style,
  };

  return (
    <span
      onMouseDown={onMouseDown}
      style={finalStyle}
      onMouseEnter={e => {
        if (!active && !reversed) {
          e.target.style.backgroundColor = '#f5f5f5';
          e.target.style.borderColor = '#bbb';
        } else if (!active && reversed) {
          e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
        }
      }}
      onMouseLeave={e => {
        if (!active && !reversed) {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.borderColor = '#ddd';
        } else if (!active && reversed) {
          e.target.style.backgroundColor = 'transparent';
        }
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export default Button;
