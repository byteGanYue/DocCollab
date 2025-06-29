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
  const providerRef = useRef(null);
  const lastDocumentId = useRef(documentId);

  // 评论相关状态
  const [comments, setComments] = useState([]);
  const yCommentsRef = useRef();
  const yTextRef = useRef();

  // 初始化 yComments 和 yText
  useEffect(() => {
    if (!docRef.current) return;
    yCommentsRef.current = docRef.current.getArray('comments');
    yTextRef.current = docRef.current.get('content', Y.XmlText);

    // 从本地存储加载评论
    loadCommentsFromStorage();
  }, [docRef, documentId]);

  // 从本地存储加载评论
  const loadCommentsFromStorage = useCallback(() => {
    try {
      const storageKey = `comments_${documentId}`;
      const savedComments = localStorage.getItem(storageKey);
      if (savedComments) {
        const parsedComments = JSON.parse(savedComments);
        setComments(parsedComments);

        // 如果有 Yjs 评论数组，同步到 Yjs
        if (yCommentsRef.current && parsedComments.length > 0) {
          parsedComments.forEach(comment => {
            if (
              !yCommentsRef.current.toArray().some(c => c.id === comment.id)
            ) {
              yCommentsRef.current.push([comment]);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load comments from storage:', error);
    }
  }, [documentId]);

  // 保存评论到本地存储
  const saveCommentsToStorage = useCallback(
    commentsToSave => {
      try {
        const storageKey = `comments_${documentId}`;
        localStorage.setItem(storageKey, JSON.stringify(commentsToSave));
      } catch (error) {
        console.error('Failed to save comments to storage:', error);
      }
    },
    [documentId],
  );

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

        // 添加评论标记到文本
        Editor.addMark(editor, 'comment', commentId);

        // 恢复原始选区
        if (savedSelection) {
          Transforms.select(editor, savedSelection);
        }

        // 更新本地评论状态
        const updatedComments = [...comments, newComment];
        setComments(updatedComments);

        // 保存到本地存储
        saveCommentsToStorage(updatedComments);

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
    [comments, checkDuplicateComment, saveCommentsToStorage],
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

        // 保存到本地存储
        saveCommentsToStorage(updatedComments);

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
    [comments, saveCommentsToStorage],
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

        // 保存到本地存储
        saveCommentsToStorage(updatedComments);

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
    [comments, saveCommentsToStorage],
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
    // 如果 documentId 没有变化，返回现有的 provider
    if (providerRef.current && lastDocumentId.current === documentId) {
      return providerRef.current;
    }

    // 清理旧的 provider
    if (providerRef.current) {
      providerRef.current.disconnect();
    }

    try {
      const newProvider = new HocuspocusProvider({
        url: WS_URL,
        name: documentId,
        document: docRef.current,
        connect: false,
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false),
      });

      providerRef.current = newProvider;
      lastDocumentId.current = documentId;
      return newProvider;
    } catch (error) {
      console.error('创建 Provider 失败:', error);
      return null;
    }
  }, [documentId]);

  // 创建编辑器实例，使用 useMemo 避免重复创建
  const editor = useMemo(() => {
    // 如果编辑器已经存在且 documentId 没有变化，返回现有编辑器
    if (editorRef.current && lastDocumentId.current === documentId) {
      return editorRef.current;
    }

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

  // 监听 yComments 变化，同步到本地状态
  useEffect(() => {
    if (!yCommentsRef.current) return;
    const handler = () => {
      const yCommentsArray = yCommentsRef.current.toArray();
      setComments(yCommentsArray);
      saveCommentsToStorage(yCommentsArray);

      // 打印 Yjs 协同数据结构
      console.log('=== Yjs 协同数据结构 ===');
      console.log('Yjs 评论数组:', yCommentsArray);
      console.log('Yjs 评论数组长度:', yCommentsArray.length);
      console.log('Yjs 文档对象:', docRef.current);
      console.log('Yjs 文档客户端ID:', docRef.current.clientID);
      console.log('Yjs 文档根节点:', docRef.current.getMap());
      console.log('Yjs 文本内容:', yTextRef.current);
      console.log('Yjs 文本长度:', yTextRef.current?.length);
      console.log('Yjs 文本内容字符串:', yTextRef.current?.toString());
      console.log('========================');
    };
    yCommentsRef.current.observe(handler);
    return () => {
      if (yCommentsRef.current) {
        yCommentsRef.current.unobserve(handler);
      }
    };
  }, [yCommentsRef, saveCommentsToStorage]);

  // 添加打印 Yjs 结构的方法
  const printYjsStructure = useCallback(() => {
    console.log('=== 手动打印 Yjs 结构 ===');
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
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.disconnect();
      }
      if (editorRef.current && YjsEditor.isYjsEditor(editorRef.current)) {
        YjsEditor.disconnect(editorRef.current);
      }
    };
  }, []);

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
