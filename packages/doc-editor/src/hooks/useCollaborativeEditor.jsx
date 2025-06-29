import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
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

// 文档管理器 - 用于维护不同文档的 Y.Doc 实例
const DocumentManager = (() => {
  const documents = new Map();

  return {
    /**
     * 获取或创建特定ID的文档
     * @param {string} docId - 文档ID
     * @returns {Y.Doc} - Y.Doc实例
     */
    getDocument: docId => {
      if (!documents.has(docId)) {
        // 创建新的文档实例
        const ydoc = new Y.Doc({ guid: docId });
        // 初始化文档数据结构
        ydoc.getArray('comments');
        ydoc.get('content', Y.XmlText);
        documents.set(docId, ydoc);
      }
      return documents.get(docId);
    },

    /**
     * 清理不再使用的文档实例
     * @param {string} docId - 文档ID
     */
    cleanupDocument: docId => {
      const doc = documents.get(docId);
      if (doc) {
        // 仅从缓存中移除，不销毁文档实例，以便后续可能的重用
        documents.delete(docId);
      }
    },
  };
})();

export function useCollaborativeEditor(documentId = 'default-document') {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [value, setValue] = useState(defaultInitialValue);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const valueInitialized = useRef(false);
  const isServerRunning = useRef(false);
  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const lastDocumentId = useRef(documentId);

  // 获取当前文档的 Y.Doc 实例
  const docRef = useRef(DocumentManager.getDocument(documentId));

  // 评论相关状态
  const [comments, setComments] = useState([]);
  const yCommentsRef = useRef();
  const yTextRef = useRef();

  // 文档ID变化时重置状态
  useEffect(() => {
    if (lastDocumentId.current !== documentId) {
      console.log(
        `[文档隔离] 切换文档: ${lastDocumentId.current} -> ${documentId}`,
      );

      // 断开旧文档
      if (providerRef.current) {
        console.log(`[文档隔离] 断开旧文档连接: ${lastDocumentId.current}`);
        try {
          providerRef.current.disconnect();
        } catch (e) {
          console.error('[文档隔离] 断开旧文档连接出错:', e);
        }
        providerRef.current = null;
      }

      if (editorRef.current) {
        try {
          if (YjsEditor.isYjsEditor(editorRef.current)) {
            console.log(
              `[文档隔离] 断开旧编辑器连接: ${lastDocumentId.current}`,
            );
            YjsEditor.disconnect(editorRef.current);
          }
        } catch (e) {
          console.error('[文档隔离] 断开旧编辑器连接出错:', e);
        }
      }

      // 设置新文档
      docRef.current = DocumentManager.getDocument(documentId);
      console.log(`[文档隔离] 获取文档实例: ${documentId}`, {
        clientID: docRef.current.clientID,
        guid: docRef.current.guid,
      });

      yCommentsRef.current = null;
      yTextRef.current = null;
      valueInitialized.current = false;

      // 更新lastDocumentId
      lastDocumentId.current = documentId;
    }
  }, [documentId]);

  // 初始化 yComments 和 yText
  useEffect(() => {
    if (!docRef.current) return;
    yCommentsRef.current = docRef.current.getArray('comments');
    yTextRef.current = docRef.current.get('content', Y.XmlText);

    // 监听 yComments 变化，同步到本地状态
    if (yCommentsRef.current) {
      const handler = () => {
        const yCommentsArray = yCommentsRef.current.toArray();
        setComments(yCommentsArray);
      };

      yCommentsRef.current.observe(handler);

      // 初始同步一次
      handler();

      return () => {
        if (yCommentsRef.current) {
          yCommentsRef.current.unobserve(handler);
        }
      };
    }
  }, [docRef.current]);

  // 检查是否存在相同范围的评论
  const checkDuplicateComment = useCallback(
    (startIndex, endIndex) => {
      return comments.some(
        comment =>
          comment.startIndex === startIndex && comment.endIndex === endIndex,
      );
    },
    [comments],
  );

  // 添加评论方法
  const addComment = useCallback(
    (startIndex, endIndex, content, author) => {
      if (!yCommentsRef.current || !yTextRef.current || !editorRef.current) {
        console.error('Comments, text reference or editor not initialized');
        return;
      }

      // 检查是否已存在相同范围的评论
      if (checkDuplicateComment(startIndex, endIndex)) {
        console.warn('Comment already exists for this range');
        return false;
      }

      try {
        const editor = editorRef.current;
        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 创建评论对象
        const newComment = {
          id: commentId,
          startIndex,
          endIndex,
          content,
          author,
          time: Date.now(),
          documentId,
        };

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
          return false;
        }

        // 设置选区到要评论的文本
        const commentRange = { anchor, focus };
        Transforms.select(editor, commentRange);

        // 在特定范围内添加评论标记，确保不影响后续输入
        const range = {
          anchor: commentRange.anchor,
          focus: commentRange.focus,
        };

        // 使用更精确的方式添加评论标记
        Transforms.setNodes(
          editor,
          { comment: commentId },
          {
            at: range,
            match: n => Text.isText(n),
            split: true,
            voids: false,
          },
        );

        // 恢复原始选区
        if (savedSelection) {
          Transforms.select(editor, savedSelection);
        }

        // 更新本地评论状态
        const updatedComments = [...comments, newComment];
        setComments(updatedComments);

        // 保存到 Yjs 数组以便协同
        if (yCommentsRef.current) {
          yCommentsRef.current.push([newComment]);

          // 打印添加评论后的 Yjs 结构
          console.log('=== 添加评论后的 Yjs 结构 ===');
          console.log('新评论:', newComment);
          console.log('Yjs 评论数组:', yCommentsRef.current.toArray());
          console.log('Yjs 评论数组长度:', yCommentsRef.current.length);
          console.log('Yjs 文本内容:', yTextRef.current.toString());
          console.log('========================');
        }

        console.log('Comment added successfully:', newComment);
        return true;
      } catch (error) {
        console.error('Error adding comment:', error);
        return false;
      }
    },
    [comments, checkDuplicateComment, documentId],
  );

  // 删除评论方法
  const deleteComment = useCallback(
    commentId => {
      try {
        const editor = editorRef.current;
        if (!editor) return false;

        // 从本地状态中移除
        const updatedComments = comments.filter(c => c.id !== commentId);
        setComments(updatedComments);

        // 从 Yjs 数组中移除
        if (yCommentsRef.current) {
          const yCommentsArray = yCommentsRef.current.toArray();
          const index = yCommentsArray.findIndex(c => c.id === commentId);
          if (index !== -1) {
            yCommentsRef.current.delete(index);
          }
        }

        // 从编辑器中移除评论标记
        for (const [node, path] of Node.texts(editor)) {
          if (node.comment === commentId) {
            Transforms.setNodes(editor, { comment: undefined }, { at: path });
          }
        }

        console.log('Comment deleted successfully:', commentId);
        return true;
      } catch (error) {
        console.error('Error deleting comment:', error);
        return false;
      }
    },
    [comments],
  );

  // 解析评论方法
  const resolveComment = useCallback(
    commentId => {
      try {
        const editor = editorRef.current;
        if (!editor) return false;

        // 从本地状态中移除
        const updatedComments = comments.filter(c => c.id !== commentId);
        setComments(updatedComments);

        // 从 Yjs 数组中移除
        if (yCommentsRef.current) {
          const yCommentsArray = yCommentsRef.current.toArray();
          const index = yCommentsArray.findIndex(c => c.id === commentId);
          if (index !== -1) {
            yCommentsRef.current.delete(index);
          }
        }

        // 从编辑器中移除评论标记
        for (const [node, path] of Node.texts(editor)) {
          if (node.comment === commentId) {
            Transforms.setNodes(editor, { comment: undefined }, { at: path });
          }
        }

        console.log('Comment resolved successfully:', commentId);
        return true;
      } catch (error) {
        console.error('Error resolving comment:', error);
        return false;
      }
    },
    [comments],
  );

  // 定位到评论位置
  const navigateToComment = useCallback(comment => {
    try {
      const editor = editorRef.current;
      if (
        !editor ||
        comment.startIndex === undefined ||
        comment.endIndex === undefined
      ) {
        return false;
      }

      // 使用全局索引找到对应的 Slate 范围
      let count = 0;
      let anchor = null;
      let focus = null;

      for (const [node, path] of Node.texts(editor)) {
        const len = Node.string(node).length;
        if (anchor === null && count + len >= comment.startIndex) {
          anchor = { path, offset: comment.startIndex - count };
        }
        if (focus === null && count + len >= comment.endIndex) {
          focus = { path, offset: comment.endIndex - count };
          break;
        }
        count += len;
      }

      if (anchor && focus) {
        const range = { anchor, focus };
        Transforms.select(editor, range);

        // 滚动到选中位置
        const editorElement = document.querySelector(
          '[data-slate-editor="true"]',
        );
        if (editorElement) {
          editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error navigating to comment:', error);
      return false;
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

  // 创建Hocuspocus Provider，使用 useMemo 避免重复创建
  const provider = useMemo(() => {
    try {
      // 清理旧的 provider
      if (providerRef.current) {
        providerRef.current.disconnect();
      }

      // 为当前文档创建新的provider
      const newProvider = new HocuspocusProvider({
        url: WS_URL,
        // 使用文档ID创建房间隔离
        name: `doc-${documentId}`,
        document: docRef.current, // 使用当前文档的Y.Doc实例
        connect: false,
        onConnect: () => {
          setIsConnected(true);
          console.log(`[文档隔离] 成功连接到文档房间: doc-${documentId}`, {
            clientID: docRef.current.clientID,
            provider: 'connected',
            awarenessClientID: newProvider.awareness.clientID,
          });
        },
        onDisconnect: () => {
          setIsConnected(false);
          console.log(`[文档隔离] 断开文档房间连接: doc-${documentId}`);
        },
      });

      providerRef.current = newProvider;
      console.log(`[文档隔离] 创建新的Provider: doc-${documentId}`);
      return newProvider;
    } catch (error) {
      console.error('创建 Provider 失败:', error);
      return null;
    }
  }, [documentId]);

  // 创建编辑器实例，使用 useMemo 避免重复创建
  const editor = useMemo(() => {
    if (!provider) {
      // 本地模式下使用强制布局
      const e = withLayout(withHistory(withReact(createEditor())));
      editorRef.current = e;
      return e;
    }

    // 使用当前文档的共享类型
    const sharedType = docRef.current.get('content', Y.XmlText);

    // 在协同模式下，只有当文档为空时才应用强制布局
    const hasContent = sharedType && sharedType.toString() !== '';

    // 如果文档已有内容，不使用强制布局
    let e;
    if (hasContent) {
      e = withYHistory(
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
      );
    } else {
      // 文档为空时才应用强制布局
      e = withLayout(
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
    }

    // 存储文档引用
    e.docRef = docRef;

    // 存储sharedType引用，便于后续访问
    e.sharedType = sharedType;

    // 自定义 insertText 方法，确保新输入的内容不继承评论标记
    const { insertText } = e;
    e.insertText = text => {
      // 清除当前选区的评论标记
      if (e.selection) {
        Transforms.setNodes(
          e,
          { comment: undefined },
          { at: e.selection, match: n => Text.isText(n) },
        );
      }
      // 调用原始的 insertText 方法
      insertText(text);
    };

    // 保证至少有一个段落，但不强制插入标题
    const { normalizeNode } = e;
    e.normalizeNode = entry => {
      const [node] = entry;
      if (!Editor.isEditor(node) || node.children.length > 0) {
        return normalizeNode(entry);
      }
      // 只插入一个空段落，不插入标题
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
  }, [provider, documentId]);

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

    try {
      // 检查编辑器是否有必要的Yjs集成能力
      const hasYjsCapability =
        typeof editor.connect === 'function' &&
        typeof editor.disconnect === 'function' &&
        editor.sharedType;

      if (hasYjsCapability) {
        console.log('[编辑器连接] 连接编辑器到Yjs');

        // 在连接之前确保有正确的共享类型关联
        if (!editor.sharedType) {
          console.warn('[编辑器连接] 编辑器缺少sharedType，尝试重新关联');
          const sharedType = docRef.current?.get('content', Y.XmlText);
          if (sharedType) {
            editor.sharedType = sharedType;
          } else {
            console.error('[编辑器连接] 无法获取共享类型');
          }
        }

        // 添加延迟连接，确保文档已完全初始化
        setTimeout(() => {
          try {
            editor.connect();
            console.log('[编辑器连接] 连接成功');
          } catch (err) {
            console.error('[编辑器连接] 延迟连接失败:', err);
          }
        }, 100);
      } else if (YjsEditor.isYjsEditor(editor)) {
        console.log('[编辑器连接] YjsEditor.connect方式连接编辑器');

        // 添加延迟连接，确保文档已完全初始化
        setTimeout(() => {
          try {
            YjsEditor.connect(editor);
            console.log('[编辑器连接] 通过YjsEditor.connect连接成功');
          } catch (err) {
            console.error('[编辑器连接] 延迟YjsEditor.connect连接失败:', err);
          }
        }, 100);
      } else {
        console.warn(
          '[编辑器连接] 编辑器不是Yjs编辑器或缺少必要属性，无法连接',
        );
      }
    } catch (error) {
      console.error('[编辑器连接] 连接编辑器失败:', error);
    }

    return () => {
      try {
        // 同样检查编辑器的连接能力
        if (editor && typeof editor.disconnect === 'function') {
          console.log('[编辑器连接] 通过editor.disconnect断开编辑器连接');
          editor.disconnect();
        } else if (editor && YjsEditor.isYjsEditor(editor)) {
          console.log('[编辑器连接] 通过YjsEditor.disconnect断开编辑器连接');
          YjsEditor.disconnect(editor);
        }
      } catch (error) {
        console.error('[编辑器连接] 断开编辑器连接失败:', error);
      }
    };
  }, [editor, provider, isConnected]);

  // 初始化文档内容
  useEffect(() => {
    const initializeContent = async () => {
      if (valueInitialized.current || !editor || !provider || !isConnected) {
        return;
      }

      // 先检查编辑器是否是协同模式的编辑器
      if (!YjsEditor.isYjsEditor(editor)) {
        console.log('[文档初始化] 非协同模式编辑器，跳过初始化');
        valueInitialized.current = true;
        return;
      }

      try {
        // 通过正确的方式获取 sharedType
        // 重要：YjsEditor.sharedType 不是一个函数，而是一个 Symbol 属性访问器
        const sharedType = editor.sharedType;

        console.log(
          '[文档初始化] 获取sharedType:',
          sharedType ? '成功' : '失败',
        );

        if (sharedType && sharedType.toString() === '') {
          // 只有在文档为空时才插入默认内容
          console.log('[文档初始化] 新文档，插入默认内容');
          try {
            // 改为使用直接设置Y.XmlText的内容的方式插入默认值，避免path不匹配的问题
            const ytext = docRef.current.get('content', Y.XmlText);

            // 检查文档是否真的为空
            if (ytext && ytext.toString() === '') {
              // 使用insertEmbed比applyDelta更安全
              const firstNode = {
                type: 'paragraph',
                children: [{ text: '协同编辑器示例' }],
              };

              // 直接使用Y.Doc的API操作，避免Slate层的path问题
              ytext.applyDelta([{ insert: JSON.stringify(firstNode) }]);

              console.log('[文档初始化] 默认内容插入成功');
              valueInitialized.current = true;
            } else {
              console.log('[文档初始化] 文档不为空，跳过插入默认内容');
              valueInitialized.current = true;
            }
          } catch (insertError) {
            console.error('[文档初始化] 插入默认内容失败:', insertError);
            valueInitialized.current = true;
          }
        } else {
          console.log('[文档初始化] 文档已存在内容，不插入默认内容');
          valueInitialized.current = true;
        }
      } catch (error) {
        console.error('[文档初始化] 初始化文档内容失败:', error);
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

  // 添加打印 Yjs 结构的方法
  const printYjsStructure = useCallback(() => {
    console.log('=== 手动打印 Yjs 结构 ===');
    console.log('当前文档ID:', documentId);
    console.log('Yjs 文档:', docRef.current);
    console.log('Yjs 评论数组:', yCommentsRef.current);
    console.log('Yjs 文本内容:', yTextRef.current);

    if (yCommentsRef.current) {
      console.log('评论数组内容:', yCommentsRef.current.toArray());
      console.log('评论数组长度:', yCommentsRef.current.length);
    }

    if (yTextRef.current) {
      console.log('文本内容长度:', yTextRef.current.length);
      console.log('文本内容:', yTextRef.current.toString());
    }

    // 打印所有共享类型
    const sharedTypes = docRef.current.share;
    console.log('所有共享类型:', sharedTypes);
    console.log('========================');
  }, [documentId]);

  // 清理函数 - 组件卸载时断开连接
  useEffect(() => {
    return () => {
      console.log(`[文档隔离] 组件卸载，清理文档: ${documentId}`);

      try {
        if (providerRef.current) {
          console.log(`[文档隔离] 断开Provider连接: doc-${documentId}`);
          providerRef.current.disconnect();
          providerRef.current = null;
        }
      } catch (error) {
        console.error('[文档隔离] 断开Provider连接失败:', error);
      }

      try {
        if (editorRef.current) {
          if (YjsEditor.isYjsEditor(editorRef.current)) {
            console.log(`[文档隔离] 断开编辑器连接: ${documentId}`);
            YjsEditor.disconnect(editorRef.current);
          }
        }
      } catch (error) {
        console.error('[文档隔离] 断开编辑器连接失败:', error);
      }

      // 清理文档实例
      console.log(`[文档隔离] 清理文档实例: ${documentId}`);
      DocumentManager.cleanupDocument(documentId);
    };
  }, [documentId]);

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
    comments,
    addComment,
    deleteComment,
    resolveComment,
    navigateToComment,
    yComments: yCommentsRef,
    printYjsStructure,
  };
}
