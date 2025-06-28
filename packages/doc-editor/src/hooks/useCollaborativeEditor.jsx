import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { createEditor, Editor, Transforms, Node } from 'slate';
import { withHistory } from 'slate-history';
import { withReact } from 'slate-react';
import {
  withYjs,
  slateNodesToInsertDelta,
  YjsEditor,
  withYHistory,
  withCursors,
} from '@slate-yjs/core';
import { withLayout } from '../utils/editorHelpers';

const ParagraphType = 'paragraph';
const WS_URL = 'ws://127.0.0.1:1234';
const defaultInitialValue = [
  {
    type: 'paragraph',
    children: [{ text: '协同编辑器示例' }],
  },
];

export function useCollaborativeEditor(documentId = 'default-document') {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [value, setValue] = useState(defaultInitialValue);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const valueInitialized = useRef(false);
  const docRef = useRef(new Y.Doc());
  const isServerRunning = useRef(false);
  const editorRef = useRef(null);

  // 评论相关 Yjs 数据结构
  const yCommentsRef = useRef();
  const yTextRef = useRef();

  // 初始化 yComments 和 yText
  useEffect(() => {
    if (!docRef.current) return;
    yCommentsRef.current = docRef.current.getArray('comments');
    yTextRef.current = docRef.current.get('content', Y.XmlText);
  }, [docRef]);

  // 添加评论方法
  const addComment = useCallback((startIndex, endIndex, content, author) => {
    if (!yCommentsRef.current || !yTextRef.current || !editorRef.current) {
      console.error('Comments, text reference or editor not initialized');
      return;
    }

    try {
      const editor = editorRef.current;

      // 保存当前选区
      const savedSelection = editor.selection;

      // 使用全局索引找到对应的 Slate 范围
      let count = 0;
      let anchor = null;
      let focus = null;

      for (const [node, path] of Node.texts(editor)) {
        const len = Node.string(node).length;
        if (anchor === null && count + len >= startIndex) {
          anchor = { path, offset: startIndex - count };
        }
        if (focus === null && count + len >= endIndex) {
          focus = { path, offset: endIndex - count };
          break;
        }
        count += len;
      }

      if (!anchor || !focus) {
        console.error('Failed to find text range for comment');
        return;
      }

      // 设置选区到要评论的文本
      const commentRange = { anchor, focus };
      Transforms.select(editor, commentRange);

      // 直接添加评论标记
      Editor.addMark(editor, 'comment', {
        id: Date.now().toString(),
        content,
        author,
        time: Date.now(),
      });

      // 恢复原始选区
      if (savedSelection) {
        Transforms.select(editor, savedSelection);
      }

      console.log('Comment added successfully');

      // 同时也保存到 Yjs 数组中以便协同
      if (startIndex !== undefined && endIndex !== undefined) {
        // 确保索引在有效范围内
        const validStartIndex = Math.max(
          0,
          Math.min(startIndex, yTextRef.current.length),
        );
        const validEndIndex = Math.max(
          validStartIndex,
          Math.min(endIndex, yTextRef.current.length),
        );

        // 创建相对位置
        const start = Y.createRelativePositionFromTypeIndex(
          yTextRef.current,
          validStartIndex,
        );
        const end = Y.createRelativePositionFromTypeIndex(
          yTextRef.current,
          validEndIndex,
        );

        if (start && end) {
          const startJSON = JSON.stringify(start);
          const endJSON = JSON.stringify(end);

          // 添加评论到 Yjs 数组
          yCommentsRef.current.push([
            {
              start: startJSON,
              end: endJSON,
              content,
              author,
              time: Date.now(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, []);

  // 检查WebSocket服务器是否在线
  const checkServerStatus = useCallback(async () => {
    try {
      const ws = new window.WebSocket(WS_URL);
      ws.onopen = () => {
        isServerRunning.current = true;
        ws.close();
      };
      ws.onerror = () => {
        isServerRunning.current = false;
        setIsConnected(false);
      };
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(isServerRunning.current);
        }, 1000);
      });
    } catch (error) {
      return false;
    }
  }, []);

  // 创建Hocuspocus Provider
  const provider = useMemo(() => {
    try {
      return new HocuspocusProvider({
        url: WS_URL,
        name: documentId,
        document: docRef.current,
        connect: false,
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false),
      });
    } catch {
      return null;
    }
  }, [documentId]);

  // 创建编辑器实例
  const editor = useMemo(() => {
    if (!provider) {
      const e = withLayout(withHistory(withReact(createEditor())));
      editorRef.current = e;
      e.docRef = docRef;
      return e;
    }
    const sharedType = provider.document.get('content', Y.XmlText);
    const e = withLayout(
      withYHistory(
        withCursors(
          withYjs(withReact(createEditor()), sharedType),
          provider.awareness,
          {
            data: {
              name: `用户${Math.floor(Math.random() * 1000)}`,
              color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            },
          },
        ),
      ),
    );
    e.docRef = docRef;
    // 保证至少有一个段落
    const { normalizeNode } = e;
    e.normalizeNode = entry => {
      const [node] = entry;
      if (!Editor.isEditor(node) || node.children.length > 0) {
        return normalizeNode(entry);
      }
      Transforms.insertNodes(
        e,
        {
          type: ParagraphType,
          children: [{ text: '' }],
        },
        { at: [0] },
      );
    };
    editorRef.current = e;
    return e;
  }, [provider]);

  // 检查服务器并尝试连接
  useEffect(() => {
    const setupConnection = async () => {
      const isOnline = await checkServerStatus();
      if (isOnline && provider) {
        provider.setAwarenessField('user', {
          name: `用户${Math.floor(Math.random() * 1000)}`,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });
        provider.connect();
      }
    };
    setupConnection();
    return () => {
      if (provider) provider.disconnect();
    };
  }, [provider, checkServerStatus]);

  // 连接编辑器与协同服务
  useEffect(() => {
    if (!editor || !provider || !isConnected) return;
    if (YjsEditor.isYjsEditor(editor)) {
      YjsEditor.connect(editor);
    }
    return () => {
      if (editor && YjsEditor.isYjsEditor(editor)) {
        YjsEditor.disconnect(editor);
      }
    };
  }, [editor, provider, isConnected]);

  // 初始化文档内容
  useEffect(() => {
    const initializeContent = async () => {
      if (
        valueInitialized.current ||
        !editor ||
        !provider ||
        !isConnected ||
        !YjsEditor.isYjsEditor(editor)
      ) {
        return;
      }
      const sharedType = YjsEditor.sharedType(editor);
      if (sharedType && sharedType.toString() === '') {
        const delta = slateNodesToInsertDelta(defaultInitialValue);
        sharedType.applyDelta(delta);
        valueInitialized.current = true;
      } else {
        valueInitialized.current = true;
      }
    };
    if (isConnected) {
      initializeContent();
    }
  }, [editor, provider, isConnected]);

  // 监听远程用户变化
  useEffect(() => {
    if (!provider?.awareness) return;
    const awarenessChangeHandler = () => {
      const states = provider.awareness.getStates();
      const users = Array.from(states.entries())
        .filter(([clientId]) => clientId !== provider.document.clientID)
        .map(([clientId, state]) => ({
          clientId,
          user: state.user,
        }));
      setRemoteUsers(users);
      setOnlineUsers(states.size);
    };
    provider.awareness.on('change', awarenessChangeHandler);
    return () => {
      if (provider.awareness) {
        provider.awareness.off('change', awarenessChangeHandler);
      }
    };
  }, [provider]);

  // AI抽屉相关
  const handleOpenAIDrawer = useCallback(() => setShowAIDrawer(true), []);
  const handleCloseAIDrawer = useCallback(() => setShowAIDrawer(false), []);

  // 监听 yComments 变化，强制刷新外部组件
  useEffect(() => {
    if (!yCommentsRef.current) return;
    const handler = () => {
      setValue(v => [...v]);
      // 触发编辑器重新装饰
      if (editorRef.current) {
        const currentSelection = editorRef.current.selection;
        editorRef.current.onChange();
        // 保持选区
        if (currentSelection) {
          editorRef.current.selection = currentSelection;
        }
      }
    };
    yCommentsRef.current.observe(handler);
    return () => {
      if (yCommentsRef.current) {
        yCommentsRef.current.unobserve(handler);
      }
    };
  }, [yCommentsRef]);

  return {
    editor,
    value,
    setValue,
    isConnected,
    onlineUsers,
    remoteUsers,
    showHelpModal,
    setShowHelpModal,
    showAIDrawer,
    setShowAIDrawer,
    handleOpenAIDrawer,
    handleCloseAIDrawer,
    // 评论相关
    yComments: yCommentsRef,
    addComment,
  };
}
