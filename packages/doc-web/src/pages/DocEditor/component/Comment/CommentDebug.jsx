import React, { useEffect, useState } from 'react';

/**
 * 评论功能调试组件
 * 用于显示调试信息和测试评论功能
 */
const CommentDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    commentManager: null,
    quillInstance: null,
    selectionEvents: [],
    buttonVisible: false,
  });

  useEffect(() => {
    // 监听控制台日志
    const originalLog = console.log;
    console.log = (...args) => {
      if (
        args[0] &&
        typeof args[0] === 'string' &&
        args[0].includes('Selection change')
      ) {
        setDebugInfo(prev => ({
          ...prev,
          selectionEvents: [...prev.selectionEvents.slice(-4), args[1]].filter(
            Boolean,
          ),
        }));
      }
      originalLog.apply(console, args);
    };

    // 检查DOM中的评论按钮
    const checkButton = () => {
      const button = document.querySelector('.comment-button');
      setDebugInfo(prev => ({
        ...prev,
        buttonVisible: button && button.style.display !== 'none',
      }));
    };

    const interval = setInterval(checkButton, 1000);

    return () => {
      console.log = originalLog;
      clearInterval(interval);
    };
  }, []);

  const testSelection = () => {
    // 模拟文本选择
    const editor = document.querySelector('.ql-editor');
    if (editor) {
      const range = document.createRange();
      const selection = window.getSelection();

      if (editor.firstChild) {
        range.setStart(editor.firstChild, 0);
        range.setEnd(
          editor.firstChild,
          Math.min(10, editor.firstChild.textContent?.length || 0),
        );
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '350px',
        background: '#fff',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '12px',
        zIndex: 999,
        maxWidth: '300px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
        评论功能调试
      </h4>

      <div style={{ marginBottom: '10px' }}>
        <strong>状态检查:</strong>
        <div>
          • 评论按钮存在:{' '}
          {document.querySelector('.comment-button') ? '✅' : '❌'}
        </div>
        <div>• 按钮可见: {debugInfo.buttonVisible ? '✅' : '❌'}</div>
        <div>
          • Quill编辑器: {document.querySelector('.ql-editor') ? '✅' : '❌'}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>最近选择事件:</strong>
        {debugInfo.selectionEvents.length > 0 ? (
          debugInfo.selectionEvents.map((event, index) => (
            <div key={index} style={{ fontSize: '10px', color: '#666' }}>
              {event?.range
                ? `选择: ${event.range.index}-${event.range.index + event.range.length}`
                : '无选择'}
            </div>
          ))
        ) : (
          <div style={{ color: '#999' }}>暂无选择事件</div>
        )}
      </div>

      <button
        onClick={testSelection}
        style={{
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        测试文本选择
      </button>

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        <div>1. 手动选择编辑器中的文本</div>
        <div>2. 查看控制台日志</div>
        <div>3. 检查按钮是否出现</div>
      </div>
    </div>
  );
};

export default CommentDebug;
