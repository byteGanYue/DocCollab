import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Button,
  Badge,
  List,
  Avatar,
  Typography,
  Space,
  Tag,
  Popconfirm,
  Empty,
  Divider,
  Tooltip,
  message,
} from 'antd';
import {
  CommentOutlined,
  CheckOutlined,
  RedoOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * 评论抽屉组件 - 使用Antd Drawer实现
 */
const CommentDrawer = ({
  visible,
  onClose,
  comments = [],
  onResolveComment,
  onDeleteComment,
  onCommentClick,
  highlightCommentId = null, // 新增：需要高亮的评论ID
}) => {
  const [commentStats, setCommentStats] = useState({
    total: 0,
    resolved: 0,
    unresolved: 0,
  });

  // 计算评论统计
  useEffect(() => {
    const total = comments.length;
    const resolved = comments.filter(c => c.resolved).length;
    const unresolved = total - resolved;

    setCommentStats({ total, resolved, unresolved });
  }, [comments]);

  // 自动滚动到指定评论
  useEffect(() => {
    if (highlightCommentId && visible) {
      setTimeout(() => {
        const element = document.querySelector(
          `[data-comment-id="${highlightCommentId}"]`,
        );
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 添加高亮效果
          element.style.backgroundColor = '#e6f7ff';
          element.style.border = '2px solid #1890ff';
          setTimeout(() => {
            element.style.backgroundColor = '';
            element.style.border = '';
          }, 2000);
        }
      }, 300);
    }
  }, [highlightCommentId, visible]);

  // 处理解决评论
  const handleResolveComment = (commentId, resolved) => {
    onResolveComment(commentId);
    message.success(resolved ? '评论已重新打开' : '评论已标记为解决');
  };

  // 处理删除评论
  const handleDeleteComment = commentId => {
    onDeleteComment(commentId);
    message.success('评论已删除');
  };

  // 格式化时间
  const formatTime = timestamp => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return new Date(timestamp).toLocaleDateString();
  };

  // 渲染评论项
  const renderCommentItem = comment => (
    <List.Item
      key={comment.id}
      data-comment-id={comment.id}
      style={{
        opacity: comment.resolved ? 0.8 : 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderRadius: '8px',
        margin: '8px 0',
        padding: '12px',
        backgroundColor: comment.resolved ? '#f6ffed' : 'transparent',
        border: comment.resolved
          ? '1px solid #d9f7be'
          : '1px solid transparent',
      }}
      onClick={() => onCommentClick && onCommentClick(comment)}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = comment.resolved
          ? '#f0f9ff'
          : '#f8f9fa';
        e.currentTarget.style.borderColor = comment.resolved
          ? '#91d5ff'
          : '#d9d9d9';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = comment.resolved
          ? '#f6ffed'
          : 'transparent';
        e.currentTarget.style.borderColor = comment.resolved
          ? '#d9f7be'
          : 'transparent';
      }}
      actions={[
        <Tooltip
          title={comment.resolved ? '重新打开' : '标记解决'}
          key="resolve"
        >
          <Button
            type="text"
            size="small"
            icon={comment.resolved ? <RedoOutlined /> : <CheckOutlined />}
            onClick={e => {
              e.stopPropagation();
              handleResolveComment(comment.id, comment.resolved);
            }}
            style={{
              color: comment.resolved ? '#faad14' : '#52c41a',
              backgroundColor: comment.resolved ? '#fff7e6' : '#f6ffed',
              border: `1px solid ${comment.resolved ? '#ffd591' : '#b7eb8f'}`,
            }}
          />
        </Tooltip>,
        <Popconfirm
          key="delete"
          title="确定要删除这条评论吗？"
          onConfirm={e => {
            e && e.stopPropagation();
            handleDeleteComment(comment.id);
          }}
          okText="确定"
          cancelText="取消"
        >
          <Tooltip title="删除评论">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: '#fff2f0',
                border: '1px solid #ffccc7',
              }}
            />
          </Tooltip>
        </Popconfirm>,
      ]}
    >
      <List.Item.Meta
        avatar={
          <Avatar
            size="small"
            style={{
              backgroundColor: comment.authorColor || '#1890ff',
              fontSize: '12px',
              opacity: comment.resolved ? 0.7 : 1,
            }}
          >
            {comment.author?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
        }
        title={
          <Space>
            <Text
              strong
              style={{
                fontSize: '13px',
                color: comment.resolved ? '#8c8c8c' : '#262626',
              }}
            >
              {comment.author || '匿名用户'}
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: '11px',
                color: comment.resolved ? '#bfbfbf' : '#8c8c8c',
              }}
            >
              {formatTime(comment.timestamp)}
            </Text>
            {comment.resolved && (
              <Tag
                color="success"
                size="small"
                style={{
                  fontSize: '10px',
                  lineHeight: '16px',
                  height: '18px',
                  borderRadius: '9px',
                }}
              >
                ✓ 已解决
              </Tag>
            )}
          </Space>
        }
        description={
          <div>
            {/* 被评论的文本 */}
            <div
              style={{
                background: comment.resolved ? '#f0f0f0' : '#f5f5f5',
                padding: '4px 8px',
                borderRadius: '4px',
                borderLeft: `3px solid ${comment.resolved ? '#52c41a' : '#faad14'}`,
                marginBottom: '8px',
                fontSize: '12px',
                fontStyle: 'italic',
                color: comment.resolved ? '#8c8c8c' : '#666',
              }}
            >
              "{comment.selectedText}"
            </div>

            {/* 评论内容 */}
            <Paragraph
              style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: '1.4',
                color: comment.resolved ? '#8c8c8c' : '#262626',
              }}
              ellipsis={{ rows: 3, expandable: true }}
            >
              {comment.content}
            </Paragraph>

            {/* 解决信息 */}
            {comment.resolved && comment.resolvedBy && (
              <div
                style={{
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#389e0d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
                <span>
                  已由{' '}
                  <Text strong style={{ color: '#389e0d' }}>
                    {comment.resolvedBy}
                  </Text>{' '}
                  于 {formatTime(comment.resolvedAt)} 标记为已解决
                </span>
              </div>
            )}
          </div>
        }
      />
    </List.Item>
  );

  return (
    <Drawer
      title={
        <Space>
          <CommentOutlined />
          <span>评论</span>
          <Badge
            count={commentStats.unresolved}
            style={{ backgroundColor: '#faad14' }}
          />
        </Space>
      }
      placement="right"
      width={400}
      open={visible}
      onClose={onClose}
      mask={false}
      maskClosable={false}
    >
      {/* 统计信息 */}
      <div style={{ marginBottom: '16px' }}>
        <Space size="large">
          <div>
            <Text type="secondary">总计</Text>
            <br />
            <Text strong style={{ fontSize: '18px' }}>
              {commentStats.total}
            </Text>
          </div>
          <div>
            <Text type="secondary">未解决</Text>
            <br />
            <Text strong style={{ fontSize: '18px', color: '#faad14' }}>
              {commentStats.unresolved}
            </Text>
          </div>
          <div>
            <Text type="secondary">已解决</Text>
            <br />
            <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
              {commentStats.resolved}
            </Text>
          </div>
        </Space>
      </div>

      <Divider />

      {/* 评论列表 */}
      {comments.length > 0 ? (
        <List
          dataSource={comments.sort((a, b) => b.timestamp - a.timestamp)}
          renderItem={renderCommentItem}
          style={{ marginTop: '16px' }}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无评论"
          style={{ marginTop: '60px' }}
        />
      )}
    </Drawer>
  );
};

export default CommentDrawer;
