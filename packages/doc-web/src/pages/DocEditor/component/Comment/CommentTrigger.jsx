import React from 'react';
import { Button, Badge, Tooltip } from 'antd';
import { CommentOutlined } from '@ant-design/icons';

/**
 * 评论触发按钮 - 固定定位在页面右侧
 */
const CommentTrigger = ({
  commentCount = 0,
  unresolvedCount = 0,
  onClick,
  visible = true,
}) => {
  if (!visible || commentCount === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        animation: 'slideInRight 0.3s ease',
      }}
    >
      <Tooltip
        title={`${commentCount} 条评论，${unresolvedCount} 条未解决`}
        placement="left"
      >
        <Badge
          count={unresolvedCount}
          offset={[-8, 8]}
          style={{ backgroundColor: '#faad14' }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<CommentOutlined />}
            onClick={onClick}
            style={{
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: 'none',
            }}
          />
        </Badge>
      </Tooltip>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CommentTrigger;
