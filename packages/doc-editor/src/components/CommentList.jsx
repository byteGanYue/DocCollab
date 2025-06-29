import React, { useEffect, useState, useRef } from 'react';
import { Editor, Node } from 'slate';

const CommentList = ({
  comments,
  onDeleteComment,
  onResolveComment,
  onNavigateToComment,
  onClearAllComments,
  editor,
}) => {
  const [localComments, setLocalComments] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectText, setSelectText] = useState('');
  const [position, setPosition] = useState({
    x: window.innerWidth - 320,
    y: 80,
  });
  const dragRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 根据起始索引和结束索引获取文本内容
  const getTextByIndex = (startIndex, endIndex) => {
    if (!editor || startIndex === undefined || endIndex === undefined) {
      return '';
    }

    try {
      console.log('=== 开始获取文本 ===');
      console.log('输入参数 - 起始索引:', startIndex, '结束索引:', endIndex);

      // 使用全局索引找到对应的 Slate 范围
      let count = 0;
      let anchor = null;
      let focus = null;

      for (const [node, path] of Node.texts(editor)) {
        const len = Node.string(node).length;
        if (anchor === null && count + len >= startIndex) {
          anchor = { path, offset: startIndex - count };
          console.log('找到起始位置:', anchor, '当前累计字符数:', count);
        }
        if (focus === null && count + len >= endIndex) {
          focus = { path, offset: endIndex - count };
          console.log('找到结束位置:', focus, '当前累计字符数:', count);
          break;
        }
        count += len;
      }

      if (anchor && focus) {
        const range = { anchor, focus };
        console.log('计算出的 Slate 范围:', range);

        // 使用 Editor.string 获取指定范围的文本内容
        const text = Editor.string(editor, range);
        console.log('获取到的文本:', text, '文本长度:', text.length);
        console.log('=== 文本获取完成 ===');
        return text;
      } else {
        console.log('无法找到对应的 Slate 范围');
        console.log('=== 文本获取失败 ===');
      }
    } catch (error) {
      console.error('获取文本内容失败:', error);
    }

    return '';
  };

  // 获取指定评论的文本内容
  const getCommentText = comment => {
    if (comment.text) {
      return comment.text; // 优先使用保存的文本
    }

    if (comment.startIndex !== undefined && comment.endIndex !== undefined) {
      return getTextByIndex(comment.startIndex, comment.endIndex);
    }

    return '';
  };

  // 同步评论数据并获取文本
  useEffect(() => {
    if (comments && Array.isArray(comments)) {
      setLocalComments(comments);

      // 如果有评论，获取第一个评论的文本作为示例
      if (comments.length > 0) {
        const firstComment = comments[0];
        const text = getCommentText(firstComment);
        setSelectText(text);
        console.log('设置选中文本状态:', text);
      }
    }
  }, [comments, editor]);

  // 拖拽相关事件处理
  useEffect(() => {
    const handleMouseDown = e => {
      // 检查是否点击了拖拽区域（标题栏）
      if (e.target.closest('.comment-drag-handle')) {
        isDraggingRef.current = true;
        setIsDragging(true);
        dragStartPos.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
        e.preventDefault();
      }
    };

    const handleMouseMove = e => {
      if (isDraggingRef.current) {
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;

        // 限制在窗口范围内
        const maxX = window.innerWidth - 300;
        const maxY = window.innerHeight - 200;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position]);

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
    <div
      ref={dragRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 300,
        maxHeight: 'calc(100vh - 100px)',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        boxShadow: isDragging
          ? '0 8px 24px rgba(0,0,0,0.25)'
          : '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
      }}
    >
      {/* 标题栏 - 可拖拽区域 */}
      <div
        className="comment-drag-handle"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
          background: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
        }}
        onMouseDown={e => {
          if (e.target.closest('.comment-drag-handle')) {
            e.currentTarget.style.cursor = 'grabbing';
          }
        }}
        onMouseUp={e => {
          e.currentTarget.style.cursor = 'grab';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>💬</span>
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
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              fontSize: '16px',
              color: '#666',
            }}
            title={isCollapsed ? '展开' : '折叠'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          <button
            onClick={() => onClearAllComments()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666',
            }}
            title="清空评论"
          >
            清空评论
          </button>
        </div>
      </div>

      {/* 评论列表内容 */}
      {!isCollapsed && (
        <>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
              minHeight: 0,
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
                      <span style={{ fontWeight: '500' }}>
                        选中的文本: {getCommentText(comment)}
                      </span>
                      <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                        {`位置 ${comment.startIndex}-${comment.endIndex}`}
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
              flexShrink: 0,
            }}
          >
            共 {localComments.length} 条评论
          </div>
        </>
      )}
    </div>
  );
};

export default CommentList;
