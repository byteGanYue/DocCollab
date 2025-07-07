import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { yjsMongoSyncService } from '../services/YjsMongoSyncService.js';
import { createEditor, Editor, Transforms, Node, Text } from 'slate';
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

export function useCollaborativeEditor(documentId) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [value, setValue] = useState(defaultInitialValue);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const valueInitialized = useRef(false);
  const docRef = useRef(null);
  const isServerRunning = useRef(false);
  const editorRef = useRef(null);
  // MongoDB 同步服务引用
  const mongoSyncRegistered = useRef(false);
  // 评论相关 Yjs 数据结构
  const yCommentsRef = useRef();
  const yTextRef = useRef();

  // 初始化 yComments 和 yText
  useEffect(() => {
    if (!docRef.current) return;
    yCommentsRef.current = docRef.current.getArray('comments');
    yTextRef.current = docRef.current.get('content', Y.XmlText);
  }, [docRef]);

  // 只保留唯一初始化入口：用后端 yjsState 初始化 Y.Doc
  useEffect(() => {
    if (!documentId) return;
    // 1. 清理全局变量
    window.ydoc = null;
    window.provider = null;
    docRef.current = null;
    // 2. 拉取后端 yjsState
    (async () => {
      let yjsState = null;
      try {
        const res = await fetch(`/api/document/${documentId}/yjs-state`);
        if (res.ok) {
          const data = await res.json();
          yjsState = data?.data?.yjsState;
        }
      } catch (e) {
        console.warn('拉取后端 yjsState 失败:', e);
      }
      // 3. 初始化 Y.Doc
      let ydoc = new Y.Doc();
      if (yjsState && yjsState.length > 0) {
        Y.applyUpdate(ydoc, new Uint8Array(yjsState));
      }
      console.log('[Y.Doc Init] yjsState 来源:', yjsState);
      console.log('[Y.Doc Init] 初始化内容:', ydoc.toJSON());
      docRef.current = ydoc;
      window.ydoc = ydoc;
      // 4. 注册 MongoDB 同步服务
      if (mongoSyncRegistered.current && documentId) {
        try {
          yjsMongoSyncService.unregisterDocumentSync(documentId);
          mongoSyncRegistered.current = false;
        } catch (error) {
          // ignore
        }
      }
      try {
        yjsMongoSyncService.registerDocumentSync(documentId, ydoc, {
          userId: JSON.parse(localStorage.getItem('userInfo'))?.userId || 1,
          username:
            JSON.parse(localStorage.getItem('userInfo'))?.username ||
            'Anonymous',
          debug: true,
        });
        mongoSyncRegistered.current = true;
      } catch (error) {
        console.error('[编辑器] MongoDB同步服务注册失败:', error);
      }
      // 5. 注册 provider
      const provider = new HocuspocusProvider({
        url: WS_URL,
        name: documentId,
        document: ydoc,
        connect: false,
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false),
        onSynced: () => {
          console.log(`[WebSocket] 文档 ${documentId} 已同步`);
        },
      });
      window.provider = provider;
      setTimeout(() => {
        provider.connect();
        console.log('[Provider] 已connect:', provider, 'Y.Doc:', ydoc.toJSON());
      }, 300);
      // 6. 重新初始化 yComments/yText
      yCommentsRef.current = ydoc.getArray('comments');
      yTextRef.current = ydoc.get('content', Y.XmlText);
      // 7. 强制刷新编辑器
      setValue(v => {
        console.log('[Editor Value] 当前 value:', v);
        return [...v];
      });
      console.log(
        '[useCollaborativeEditor] 只用后端 yjsState 初始化Y.Doc，彻底切断本地缓存影响',
      );
    })();
  }, [documentId]);

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

      // 生成唯一的评论ID
      const commentId = Date.now().toString();

      // 直接添加评论标记到选中的文本
      Editor.addMark(editor, 'comment', {
        id: commentId,
        content,
        author,
        time: Date.now(),
      });

      // 恢复原始选区
      if (savedSelection) {
        Transforms.select(editor, savedSelection);
      }

      // 清除编辑器的活动标记状态，防止影响后续输入
      // 注意：这里只清除活动标记，不影响已经应用到文本节点上的标记
      editor.marks = null;

      // 延迟清除活动标记，确保不影响后续输入
      setTimeout(() => {
        editor.marks = null;
      }, 0);

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
              id: commentId,
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
      const p = new HocuspocusProvider({
        url: WS_URL,
        name: documentId,
        document: docRef.current,
        connect: false,
        onConnect: () => {
          console.log(`[WebSocket] 已连接到服务器: ${documentId}`);
          setIsConnected(true);
        },
        onDisconnect: () => {
          console.log(`[WebSocket] 已断开连接: ${documentId}`);
          setIsConnected(false);
        },
        onSynced: () => {
          console.log(`[WebSocket] 文档 ${documentId} 已同步`);
        },
      });
      window.provider = p; // 挂载到window，便于全局访问
      return p;
    } catch (error) {
      console.error('[WebSocket] 创建Provider失败:', error);
      return null;
    }
  }, [documentId]);

  // 获取用户信息
  const getUserInfo = () => {
    try {
      // 优先从localStorage获取userInfo
      const userInfoStr = localStorage.getItem('userInfo');
      let userInfo = null;

      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
      }

      // 如果userInfo中没有用户名，尝试从其他可能的字段获取
      const username = userInfo?.username || '匿名用户';

      // 生成基于用户名的固定颜色，确保同一用户总是使用相同颜色
      const generateColorFromUsername = name => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 60%)`;
      };

      return {
        name: username,
        color: userInfo?.color || generateColorFromUsername(username),
        userId: userInfo?.userId || 'unknown',
      };
    } catch (error) {
      console.warn('获取用户信息失败:', error);
      return {
        name: '匿名用户',
        color: 'hsl(0, 70%, 60%)',
        userId: 'unknown',
      };
    }
  };

  // 创建编辑器实例
  const editor = useMemo(() => {
    if (!provider) {
      const e = withLayout(withHistory(withReact(createEditor())));
      editorRef.current = e;
      e.docRef = docRef;
      return e;
    }
    const sharedType = provider.document.get('content', Y.XmlText);
    const userInfo = getUserInfo();
    const e = withLayout(
      withYHistory(
        withCursors(
          withYjs(withReact(createEditor()), sharedType),
          provider.awareness,
          {
            data: {
              name: userInfo.name,
              color: userInfo.color,
              userId: userInfo.userId,
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
        const userInfo = getUserInfo();
        provider.setAwarenessField('user', {
          name: userInfo.name,
          color: userInfo.color,
          userId: userInfo.userId,
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
      if (!editor || valueInitialized.current) return;
      // 等待IndexedDB同步完成
      if (indexeddbProvider.current && !indexeddbProvider.current.synced) {
        await new Promise(resolve => {
          indexeddbProvider.current.on('synced', resolve);
        });
      }
      if (
        editor &&
        typeof YjsEditor.sharedType === 'function' &&
        typeof YjsEditor.isYjsEditor === 'function' &&
        YjsEditor.isYjsEditor(editor)
      ) {
        const sharedType = YjsEditor.sharedType(editor);
        if (sharedType && typeof sharedType.toString === 'function') {
          const hasContent = sharedType.toString() !== '';
          if (!hasContent) {
            const externalValue = window.currentExternalValue;
            if (externalValue && Array.isArray(externalValue)) {
              const delta = slateNodesToInsertDelta(externalValue);
              sharedType.applyDelta(delta);
              window.currentExternalValue = null;
            } else {
              const delta = slateNodesToInsertDelta(defaultInitialValue);
              sharedType.applyDelta(delta);
            }
          }
        }
      }
      valueInitialized.current = true;
    };
    initializeContent();
    // 清理副作用
    return () => {
      valueInitialized.current = false;
    };
  }, [editor]);

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
    console.log('yCommentsRef.current', yCommentsRef.current);
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
  // 删除评论方法
  const removeComment = useCallback(
    commentId => {
      try {
        if (!editor || !commentId) {
          console.error('Editor or commentId is missing');
          return;
        }

        console.log('Removing comment:', commentId);

        // 保存当前选区
        const { selection } = editor;

        // 1. 从 Slate 编辑器中移除评论标记
        // 遍历所有文本节点，找到包含指定评论ID的节点并移除标记
        const nodesToUpdate = [];
        for (const [node, path] of Node.texts(editor)) {
          if (node.comment && node.comment.id === commentId) {
            nodesToUpdate.push(path);
          }
        }

        // 批量移除评论标记
        for (const path of nodesToUpdate) {
          try {
            // 方法1: 使用 Transforms.unsetNodes 移除 comment 属性
            Transforms.unsetNodes(editor, 'comment', {
              at: path,
              match: n =>
                Text.isText(n) && n.comment && n.comment.id === commentId,
            });

            // 方法2: 直接操作节点属性（备用方案）
            const node = Node.get(editor, path);
            if (
              Text.isText(node) &&
              node.comment &&
              node.comment.id === commentId
            ) {
              // 创建新的节点，不包含 comment 属性
              const { comment, ...nodeWithoutComment } = node;
              Transforms.setNodes(editor, nodeWithoutComment, { at: path });
            }
          } catch (error) {
            console.warn(
              'Failed to remove comment from node at path:',
              path,
              error,
            );
          }
        }

        // 2. 清除编辑器中的活动标记，防止影响后续输入
        // 这是关键步骤：确保光标位置不会继承评论标记
        if (editor.marks && editor.marks.comment) {
          delete editor.marks.comment;
        }

        // 强制移除所有评论相关的活动标记
        Editor.removeMark(editor, 'comment');

        // 3. 从 Yjs 评论数组中移除评论数据
        // 注意：Yjs 数组中的评论数据结构可能不同，需要检查多种可能的 ID 字段
        if (yCommentsRef.current) {
          const yCommentsArray = yCommentsRef.current.toArray();
          for (let i = yCommentsArray.length - 1; i >= 0; i--) {
            const comment = yCommentsArray[i];
            // 检查不同可能的 ID 字段和数据结构
            const commentToCheck = Array.isArray(comment)
              ? comment[0]
              : comment;
            if (
              commentToCheck &&
              (commentToCheck.id === commentId ||
                (commentToCheck.content &&
                  commentToCheck.author &&
                  JSON.stringify(commentToCheck).includes(commentId)))
            ) {
              yCommentsRef.current.delete(i, 1);
              console.log('Removed comment from Yjs array at index:', i);
              break;
            }
          }
        }

        // 4. 恢复原始选区并确保清除标记状态
        if (selection) {
          Transforms.select(editor, selection);
          // 再次确保当前选区没有评论标记
          Editor.removeMark(editor, 'comment');
        }

        // 5. 强制重新规范化编辑器，确保所有标记都被清除
        Editor.normalize(editor, { force: true });

        // 6. 强制触发编辑器重新渲染
        editor.onChange();

        // 7. 延迟再次清除活动标记，确保彻底清除
        setTimeout(() => {
          if (editor.marks && editor.marks.comment) {
            delete editor.marks.comment;
          }
          Editor.removeMark(editor, 'comment');
        }, 0);

        console.log('Comment removed successfully');
      } catch (error) {
        console.error('Error removing comment:', error);
      }
    },
    [editor],
  );

  /**
   * 强制用历史yjsState重建Y.Doc和协同流
   * @param {Uint8Array|Array} yjsStateArr 历史版本的yjsState
   */
  const forceRestoreYjsState = useCallback(
    yjsStateArr => {
      // 1. 断开 provider
      if (window.provider) window.provider.disconnect();
      // 2. 注销 MongoDB 同步服务
      if (mongoSyncRegistered.current && documentId) {
        try {
          yjsMongoSyncService.unregisterDocumentSync(documentId);
          mongoSyncRegistered.current = false;
        } catch (error) {
          // ignore
        }
      }
      // 3. 彻底重建 Y.Doc
      const newYDoc = new Y.Doc();
      const update = new Uint8Array(yjsStateArr);
      console.log(
        '[forceRestoreYjsState] 开始回滚，目标 yjsState:',
        yjsStateArr,
      );
      Y.applyUpdate(newYDoc, update);
      console.log('[forceRestoreYjsState] 新建 Y.Doc，内容:', newYDoc.toJSON());
      docRef.current = newYDoc;
      window.ydoc = newYDoc;
      // 4. 重新注册 MongoDB 同步服务
      try {
        yjsMongoSyncService.registerDocumentSync(documentId, newYDoc, {
          userId: JSON.parse(localStorage.getItem('userInfo'))?.userId || 1,
          username:
            JSON.parse(localStorage.getItem('userInfo'))?.username ||
            'Anonymous',
          debug: true,
        });
        mongoSyncRegistered.current = true;
      } catch (error) {
        console.error('[编辑器] MongoDB同步服务注册失败:', error);
      }
      // 5. 重新创建 provider
      const newProvider = new HocuspocusProvider({
        url: WS_URL,
        name: documentId,
        document: newYDoc,
        connect: false,
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false),
        onSynced: () => {
          console.log(`[WebSocket] 文档 ${documentId} 已同步`);
        },
      });
      window.provider = newProvider;
      setTimeout(() => {
        newProvider.connect();
        console.log(
          '[forceRestoreYjsState] provider 注册完成',
          newProvider,
          'Y.Doc:',
          newYDoc.toJSON(),
        );
      }, 300);
      // 6. 重新初始化 yComments/yText
      yCommentsRef.current = newYDoc.getArray('comments');
      yTextRef.current = newYDoc.get('content', Y.XmlText);
      // 7. 强制刷新编辑器
      setValue(v => {
        console.log('[forceRestoreYjsState] Editor Value 回滚后:', v);
        return [...v];
      });
      console.log(
        '[useCollaborativeEditor] 已彻底重建Y.Doc和协同流并恢复历史状态（无本地缓存）',
      );
    },
    [documentId],
  );

  if (!documentId) {
    // 没有文档ID时不进行协同初始化和请求
    return {
      editor: null,
      provider: null,
      ydoc: null,
      status: 'no-document',
    };
  }

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
    removeComment,
    // 新增：彻底重建Y.Doc并恢复历史状态
    forceRestoreYjsState,
  };
}
