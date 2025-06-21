import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Space, message } from 'antd';
import { CommentOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * 评论输入模态框组件
 * 用于输入评论内容
 */
const CommentModal = ({
  visible = false,
  selectedText = '',
  onCancel,
  onSubmit,
}) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // 重置状态
  useEffect(() => {
    if (visible) {
      console.log('CommentModal opened with selectedText:', {
        selectedText,
        length: selectedText?.length || 0,
        type: typeof selectedText,
        isEmpty: !selectedText || selectedText.trim() === '',
      });
      setComment('');
      setLoading(false);
    }
  }, [visible, selectedText]);

  // 处理提交
  const handleSubmit = async () => {
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      message.warning('请输入评论内容');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(trimmedComment);
      setComment('');
      message.success('评论添加成功');
    } catch (error) {
      message.error('评论添加失败');
      console.error('Error submitting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 截断文本显示
  const truncateText = (text, maxLength = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Modal
      title={
        <Space>
          <CommentOutlined style={{ color: '#1890ff' }} />
          <span>添加评论</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={520}
      centered
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          提交评论
        </Button>,
      ]}
    >
      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          为以下文本添加评论：
        </Text>
        <div
          style={{
            background: '#f5f5f5',
            padding: '8px 12px',
            borderRadius: '6px',
            borderLeft: '3px solid #1890ff',
            marginTop: '8px',
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#666',
            lineHeight: '1.4',
          }}
        >
          "{selectedText ? truncateText(selectedText, 50) : '未选择文本'}"
        </div>
      </div>

      <TextArea
        value={comment}
        onChange={e => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入您的评论..."
        rows={4}
        maxLength={1000}
        showCount
        autoFocus
        style={{
          resize: 'none',
          fontSize: '14px',
        }}
      />

      <div style={{ marginTop: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          提示：按 Ctrl/Cmd + Enter 快速提交
        </Text>
      </div>
    </Modal>
  );
};

export default CommentModal;
