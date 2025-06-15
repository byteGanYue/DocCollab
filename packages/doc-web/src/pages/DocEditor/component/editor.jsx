import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { QuillBinding } from 'y-quill';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import DoUsername from 'do_username';

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

  // 初始化编辑器
  useEffect(() => {
    if (!editorRef.current) return;

    // 初始化 Quill 编辑器
    const quill = new Quill(editorRef.current, {
      modules: {
        cursors: true,
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline'],
          ['image', 'code-block'],
        ],
        history: {
          userOnly: true,
        },
      },
      placeholder: '开始协作编辑...',
      theme: 'snow',
    });
    quillRef.current = quill;

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
    <div className="editor-container">
      <div className="editor-header">
        <input
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder="输入用户名"
          className="username-input"
        />
        <div className="users-list">
          {users.map((user, index) => (
            <div
              key={index}
              style={{ color: user.color }}
              className="user-item"
            >
              • {user.name}
            </div>
          ))}
        </div>
      </div>
      <div className="editor-wrapper">
        <div id="editor" ref={editorRef} className="quill-editor" />
      </div>
    </div>
  );
};

export default Editor;
