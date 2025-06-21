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
  CloseOutlined,
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
      style={{
        opacity: comment.resolved ? 0.7 : 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={() => onCommentClick && onCommentClick(comment)}
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
            }}
          />
        </Tooltip>,
        <Popconfirm
          key="delete"
          title="确定要删除这条评论吗？"
          onConfirm={e => {
            e.stopPropagation();
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
            }}
          >
            {comment.author?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
        }
        title={
          <Space>
            <Text strong style={{ fontSize: '13px' }}>
              {comment.author || '匿名用户'}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {formatTime(comment.timestamp)}
            </Text>
            {comment.resolved && (
              <Tag color="success" size="small">
                已解决
              </Tag>
            )}
          </Space>
        }
        description={
          <div>
            {/* 被评论的文本 */}
            <div
              style={{
                background: '#f5f5f5',
                padding: '4px 8px',
                borderRadius: '4px',
                borderLeft: `3px solid ${comment.resolved ? '#52c41a' : '#faad14'}`,
                marginBottom: '8px',
                fontSize: '12px',
                fontStyle: 'italic',
                color: '#666',
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
                  borderRadius: '4px',
                  padding: '6px 8px',
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#389e0d',
                }}
              >
                ✅ 已由 <Text strong>{comment.resolvedBy}</Text> 于{' '}
                {formatTime(comment.resolvedAt)} 标记为已解决
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
      extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
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
