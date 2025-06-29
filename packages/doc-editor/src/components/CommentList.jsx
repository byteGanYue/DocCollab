import React, { useEffect, useState } from 'react';
import { Editor, Node } from 'slate';

const CommentList = ({
  comments,
  onDeleteComment,
  onResolveComment,
  onNavigateToComment,
}) => {
  const [localComments, setLocalComments] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  // 同步评论数据
  useEffect(() => {
    if (comments && Array.isArray(comments)) {
      setLocalComments(comments);
    }
  }, [comments]);

  if (localComments.length === 0) return null;

  const handleDelete = commentId => {
    if (onDeleteComment) {
      onDeleteComment(commentId);
    }
  };

  const handleResolve = commentId => {
    if (onResolveComment) {
      onResolveComment(commentId);
    }
  };

  const handleNavigate = comment => {
    if (onNavigateToComment) {
      onNavigateToComment(comment);
    }
  };

  return (
    <>
      {isCollapsed ? (
        <div
          style={{
            position: 'fixed',
            right: 20,
            top: 80,
            width: 300,
            maxHeight: 'calc(100vh - 98px)',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 标题栏 */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e0e0e0',
              background: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              评论列表 ({localComments.length})
            </h4>
            <span
              style={{
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer',
              }}
              onClick={() => setLocalComments([])}
            >
              清空
            </span>
            <button onClick={() => setIsCollapsed(!isCollapsed)}>
              {!isCollapsed ? '展开' : '收起'}
            </button>
          </div>

          {/* 评论列表 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
            }}
          >
            {localComments.map((comment, index) => (
              <div
                key={comment.id || index}
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  position: 'relative',
                }}
              >
                {/* 评论内容 */}
                <div
                  style={{
                    fontSize: '14px',
                    color: '#333',
                    lineHeight: '1.4',
                    marginBottom: '8px',
                    wordBreak: 'break-word',
                  }}
                >
                  {comment.content}
                </div>

                {/* 评论信息 */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{comment.author || '匿名用户'}</span>
                  <span>
                    {comment.time && new Date(comment.time).toLocaleString()}
                  </span>
                </div>

                {/* 选中的文本 */}
                {comment.startIndex !== undefined &&
                  comment.endIndex !== undefined && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#007bff',
                        background: '#e3f2fd',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        borderLeft: '3px solid #007bff',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleNavigate(comment)}
                      title="点击定位到评论位置"
                    >
                      <span style={{ fontWeight: '500' }}>选中的文本:</span>
                      <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                        "
                        {comment.text ||
                          `位置 ${comment.startIndex}-${comment.endIndex}`}
                        "
                      </div>
                    </div>
                  )}

                {/* 操作按钮 */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    onClick={() => handleNavigate(comment)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #007bff',
                      background: '#fff',
                      color: '#007bff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = '#007bff';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = '#fff';
                      e.target.style.color = '#007bff';
                    }}
                  >
                    定位
                  </button>
                  <button
                    onClick={() => handleResolve(comment.id)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #28a745',
                      background: '#fff',
                      color: '#28a745',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = '#28a745';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = '#fff';
                      e.target.style.color = '#28a745';
                    }}
                  >
                    解决
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #dc3545',
                      background: '#fff',
                      color: '#dc3545',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = '#dc3545';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = '#fff';
                      e.target.style.color = '#dc3545';
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 底部提示 */}
          <div
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              color: '#666',
              background: '#f8f9fa',
              borderTop: '1px solid #e0e0e0',
              textAlign: 'center',
            }}
          >
            共 {localComments.length} 条评论
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            right: 20,
            top: 80,
            width: 300,
            maxHeight: 'calc(100vh - 98px)',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 标题栏 */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e0e0e0',
              background: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              评论列表 ({localComments.length})
            </h4>
            <span
              style={{
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer',
              }}
              onClick={() => setLocalComments([])}
            >
              清空
            </span>
            <button onClick={() => setIsCollapsed(!isCollapsed)}>
              {!isCollapsed ? '展开' : '收起'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CommentList;
