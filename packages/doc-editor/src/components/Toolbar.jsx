import React from 'react';

/**
 * 工具栏组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
const Toolbar = ({ children }) => {
  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 16px',
        margin: '0 -16px 16px',
        borderBottom: '2px solid #f0f0f0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        background: '#fafafa',
        borderRadius: '8px 8px 0 0',
      }}
    >
      {children}
    </div>
  );
};

export default Toolbar;
