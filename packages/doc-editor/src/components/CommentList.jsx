import React, { useEffect, useState } from 'react';
import { Editor, Node } from 'slate';

const CommentList = ({ yComments, editor }) => {
  const [comments, setComments] = useState([]);

  // 从编辑器中收集所有评论标记
  useEffect(() => {
    if (!editor) return;

    const collectComments = () => {
      const commentMarks = [];

      // 遍历所有文本节点，查找包含评论标记的节点
      for (const [node, path] of Node.texts(editor)) {
        // 查找当前节点上的评论标记
        if (node.comment && typeof node.comment === 'object') {
          commentMarks.push({
            ...node.comment,
            path,
            text: Node.string({ text: node.text }),
          });
        }
      }

      // 如果有 Yjs 评论，也加入列表
      if (yComments?.current) {
        const yCommentsArray = yComments.current.toArray();
        for (const comment of yCommentsArray) {
          if (!commentMarks.some(c => c.id === comment.id)) {
            commentMarks.push(comment);
          }
        }
      }

      setComments(commentMarks);
    };

    // 初始收集
    collectComments();

    // 编辑器变化时重新收集
    const observer = new MutationObserver(collectComments);
    const editorElement = document.querySelector('[data-slate-editor="true"]');
    if (editorElement) {
      observer.observe(editorElement, {
        subtree: true,
        characterData: true,
        childList: true,
        attributes: true,
      });
    }

    return () => observer.disconnect();
  }, [editor, yComments]);

  if (comments.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        right: 20,
        top: 80,
        width: 260,
        background: '#fffbe6',
        border: '1px solid #ffe58f',
        borderRadius: 6,
        padding: 12,
        zIndex: 100,
      }}
    >
      <h4 style={{ margin: 0, marginBottom: 8 }}>评论列表</h4>
      {comments.length === 0 && <div style={{ color: '#aaa' }}>暂无评论</div>}
      {comments.map((item, idx) => (
        <div
          key={item.id || idx}
          style={{
            marginBottom: 10,
            padding: 6,
            background: '#fff',
            borderRadius: 4,
          }}
        >
          <div style={{ fontSize: 13, color: '#333' }}>{item.content}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {item.author} {item.time && new Date(item.time).toLocaleString()}
          </div>
          {item.text && (
            <div
              style={{
                fontSize: 12,
                color: '#999',
                fontStyle: 'italic',
                marginTop: 4,
                background: '#f9f9f9',
                padding: '2px 4px',
                borderRadius: 2,
              }}
            >
              "{item.text}"
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentList;
