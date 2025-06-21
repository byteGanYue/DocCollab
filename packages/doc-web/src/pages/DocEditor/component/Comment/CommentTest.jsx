import React from 'react';

/**
 * 评论功能测试组件
 * 用于验证评论功能是否正常工作
 */
const CommentTest = () => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: '#f8f9fa',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        fontSize: '12px',
        zIndex: 999,
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>评论功能测试</h4>
      <div>1. 选择文本查看评论按钮</div>
      <div>2. 点击按钮添加评论</div>
      <div>3. 查看右侧评论面板</div>
      <div>4. 点击评论跳转到对应文本</div>
    </div>
  );
};

export default CommentTest;
