import React from 'react';
import { Button } from 'antd';
import { CommentOutlined } from '@ant-design/icons';

/**
 * 浮动评论按钮组件
 * 用于在选中文本时显示添加评论的按钮
 */
const CommentButton = ({
  visible = false,
  position = { left: 0, top: 0 },
  onClick,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      <Button
        type="primary"
        size="small"
        icon={<CommentOutlined />}
        onClick={onClick}
        style={{
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontSize: '12px',
          height: '32px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        添加评论
      </Button>
    </div>
  );
};

export default CommentButton;
