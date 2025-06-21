import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { QuillBinding } from 'y-quill';
import DoUsername from 'do_username';
import { USER_COLORS } from './toolbarConfig.js';

// 初始化协同编辑
export const initCollaboration = (quill, setUsername, setUsers, myColor) => {
  // 初始化 Yjs 文档
  const ydoc = new Y.Doc();
  const provider = new WebrtcProvider('quill-demo-awareness-room', ydoc);

  // 获取共享文本
  const ytext = ydoc.getText('quill');
  const awareness = provider.awareness;

  // 绑定 Quill 和 Yjs
  const binding = new QuillBinding(ytext, quill, awareness);

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

  return { binding, provider, awareness };
};

// 更新用户名
export const updateUsername = (awareness, newUsername, myColor) => {
  if (awareness) {
    awareness.setLocalStateField('user', {
      name: newUsername,
      color: myColor,
    });
  }
};

// 清理协同编辑资源
export const cleanupCollaboration = (binding, provider) => {
  if (binding) {
    binding.destroy();
  }
  if (provider) {
    provider.destroy();
  }
};
