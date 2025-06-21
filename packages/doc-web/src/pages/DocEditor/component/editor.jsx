import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { QuillBinding } from 'y-quill';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import DoUsername from 'do_username';
import styles from './editor.module.less';
import 'quill/dist/quill.core.css';
// 注册 Quill 光标模块
Quill.register('modules/cursors', QuillCursors);

// 用户颜色列表
const USER_COLORS = [
  '#30bced',
  '#6eeb83',
  '#ffbc42',
  '#ecd444',
  '#ee6352',
  '#9ac2c9',
  '#8acb88',
  '#1be7ff',
];

// 工具栏按钮提示配置
const TOOLBAR_TOOLTIPS = {
  bold: '粗体 (Ctrl+B)',
  italic: '斜体 (Ctrl+I)',
  underline: '下划线 (Ctrl+U)',
  strike: '删除线',
  header: '标题',
  color: '文字颜色',
  background: '背景颜色',
  align: '对齐方式',
  list: '列表',
  indent: '缩进',
  link: '插入链接',
  blockquote: '引用',
  'code-block': '代码块',
  table: '插入表格',
  image: '插入图片',
  video: '插入视频',
  clean: '清除格式',
};

const Editor = () => {
  // 使用 ref 来存储 Quill 实例和 DOM 元素
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const awarenessRef = useRef(null);

  // 状态管理
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [myColor] = useState(
    () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
  );

  // 字数统计状态
  const [stats, setStats] = useState({
    characters: 0,
    words: 0,
    lines: 0,
    paragraphs: 0,
  });

  // 添加工具栏提示样式
  useEffect(() => {
    const styleId = 'quill-toolbar-tooltips';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .ql-toolbar .ql-formats button,
        .ql-toolbar .ql-formats .ql-picker {
          position: relative;
        }
        
        .ql-toolbar .ql-formats button:hover::after,
        .ql-toolbar .ql-formats .ql-picker:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
          pointer-events: none;
        }
        
        .ql-toolbar .ql-formats button:hover::before,
        .ql-toolbar .ql-formats .ql-picker:hover::before {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-bottom-color: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          pointer-events: none;
        }
        
        .editor-stats {
          display: flex;
          gap: 16px;
          padding: 8px 16px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
          font-size: 12px;
          color: #6c757d;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .stat-label {
          font-weight: 500;
        }
        
        .stat-value {
          color: #495057;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // 计算字数统计
  const calculateStats = text => {
    const trimmedText = text.trim();
    const characters = trimmedText.length;
    const words = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const lines = trimmedText ? trimmedText.split('\n').length : 0;
    const paragraphs = trimmedText ? trimmedText.split(/\n\s*\n/).length : 0;

    return { characters, words, lines, paragraphs };
  };

  // 初始化编辑器
  useEffect(() => {
    if (!editorRef.current) return;

    // 初始化 Quill 编辑器
    const quill = new Quill(editorRef.current, {
      modules: {
        cursors: true,
        toolbar: [
          // 字体
          [{ font: [] }],
          // 标题 H1-H6
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          // 文本样式
          ['bold', 'italic', 'underline', 'strike'],
          // 颜色和背景色
          [{ color: [] }, { background: [] }],
          // 对齐方式
          [{ align: [] }],
          // 列表和缩进
          [
            { list: 'ordered' },
            { list: 'bullet' },
            { indent: '-1' },
            { indent: '+1' },
          ],
          // 链接和引用
          ['link', 'blockquote'],
          // 代码和表格
          ['code-block', 'table'],
          // 媒体
          ['image', 'video'],
          // 清除格式
          ['clean'],
        ],
        history: {
          userOnly: true,
        },
      },
      placeholder: '开始协作编辑...',
      theme: 'snow',
    });
    quillRef.current = quill;

    // 监听文本变化，更新字数统计
    quill.on('text-change', () => {
      const text = quill.getText();
      const newStats = calculateStats(text);
      setStats(newStats);
    });

    // 为工具栏按钮添加提示
    setTimeout(() => {
      const toolbar = document.querySelector('.ql-toolbar');
      if (toolbar) {
        const buttons = toolbar.querySelectorAll('button, .ql-picker');
        buttons.forEach(button => {
          const action =
            button.getAttribute('data-value') ||
            button.classList.toString().match(/ql-(\w+)/)?.[1];
          if (action && TOOLBAR_TOOLTIPS[action]) {
            button.setAttribute('data-tooltip', TOOLBAR_TOOLTIPS[action]);
          }
        });
      }
    }, 100);

    // 初始化 Yjs 文档
    const ydoc = new Y.Doc();
    const provider = new WebrtcProvider('quill-demo-awareness-room', ydoc);
    providerRef.current = provider;

    // 获取共享文本
    const ytext = ydoc.getText('quill');
    const awareness = provider.awareness;
    awarenessRef.current = awareness;

    // 绑定 Quill 和 Yjs
    const binding = new QuillBinding(ytext, quill, awareness);
    bindingRef.current = binding;

    // 设置初始用户名
    const initialUsername = DoUsername.generate(15);
    setUsername(initialUsername);
    awareness.setLocalStateField('user', {
      name: initialUsername,
      color: myColor,
    });

    // 监听用户状态变化
    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().entries());
      const userList = states
        .filter(([, state]) => state.user)
        .map(([, state]) => ({
          name: state.user.name,
          color: state.user.color,
        }));
      setUsers(userList);
    });

    // 清理函数
    return () => {
      binding.destroy();
      provider.destroy();
    };
  }, [myColor]);

  // 处理用户名变化
  const handleUsernameChange = e => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (awarenessRef.current) {
      awarenessRef.current.setLocalStateField('user', {
        name: newUsername,
        color: myColor,
      });
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <input
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder="输入用户名"
          className={styles.usernameInput}
        />
        <div className={styles.usersList}>
          {users.map((user, index) => (
            <div
              key={index}
              style={{ color: user.color }}
              className={styles.userItem}
            >
              • {user.name}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.editorWrapper}>
        <div id="editor" ref={editorRef} className={styles.quillEditor} />
      </div>
      {/* 字数统计栏 */}
      <div className="editor-stats">
        <div className="stat-item">
          <span className="stat-label">字符:</span>
          <span className="stat-value">{stats.characters}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">单词:</span>
          <span className="stat-value">{stats.words}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">行数:</span>
          <span className="stat-value">{stats.lines}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">段落:</span>
          <span className="stat-value">{stats.paragraphs}</span>
        </div>
      </div>
    </div>
  );
};

export default Editor;
