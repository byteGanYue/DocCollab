import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import styles from './editor.module.less';
import 'quill/dist/quill.core.css';

// 导入配置和工具函数
import {
  TOOLBAR_CONFIG,
  USER_COLORS,
  addToolbarStyles,
  addToolbarTooltips,
  calculateStats,
  handleSave,
  handleShare,
  copyShareUrl,
  showDownloadMenu,
  initCollaboration,
  updateUsername,
  cleanupCollaboration,
  showPDFMenu,
} from '../../../../utils/index.js';

// 注册 Quill 光标模块
Quill.register('modules/cursors', QuillCursors);

// 导入并注册评论格式（必须在Quill实例化之前）
import './Comment/commentFormat.js'; // 注册评论格式
import './Comment/comment.module.less'; // 导入评论样式

// 导入评论功能
import {
  CommentManager,
  CommentDrawer,
  CommentTrigger,
  CommentButton,
  CommentModal,
} from './Comment';

// 导入UI组件
import EditorHeader from './EditorHeader.jsx';
import TextStats from './TextStats.jsx';
import ShareModal from './ShareModal.jsx';

const Editor = () => {
  // 使用 ref 来存储 Quill 实例和 DOM 元素
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const awarenessRef = useRef(null);
  const commentManagerRef = useRef(null); // 评论管理器引用
  const yDocRef = useRef(null); // Yjs文档引用

  // 状态管理
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [myColor] = useState(
    () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
  );

  // 字数统计状态
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);

  // 保存和分享状态
  const [saveLoading, setSaveLoading] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [documentTitle, setDocumentTitle] = useState('未命名文档');

  // 评论相关状态
  const [comments, setComments] = useState([]);
  const [commentDrawerVisible, setCommentDrawerVisible] = useState(false);
  const [commentStats, setCommentStats] = useState({
    total: 0,
    unresolved: 0,
  });
  const [highlightCommentId, setHighlightCommentId] = useState(null);

  // 新增：评论按钮和模态框状态
  const [commentButtonVisible, setCommentButtonVisible] = useState(false);
  const [commentButtonPosition, setCommentButtonPosition] = useState({
    left: 0,
    top: 0,
  });
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedTextForComment, setSelectedTextForComment] = useState('');

  // 添加工具栏提示样式
  useEffect(() => {
    addToolbarStyles();
  }, []);

  // 初始化编辑器
  useEffect(() => {
    if (!quillRef.current) {
      const quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
          toolbar: TOOLBAR_CONFIG,
          cursors: true,
        },
        placeholder: '开始编写您的文档...',
      });

      quillRef.current = quill;

      // 初始化协同编辑
      const { binding, provider, awareness, yDoc } = initCollaboration(
        quill,
        setUsername,
        setUsers,
        myColor,
      );
      bindingRef.current = binding;
      providerRef.current = provider;
      awarenessRef.current = awareness;
      yDocRef.current = yDoc;

      // 初始化评论管理器 - 恢复完整版本
      if (yDoc && awareness) {
        const commentManager = new CommentManager(quill, yDoc, awareness, {
          onCommentsChange: commentsArray => {
            console.log('Comments updated:', commentsArray);
            setComments(commentsArray);
            const total = commentsArray.length;
            const unresolved = commentsArray.filter(c => !c.resolved).length;
            setCommentStats({ total, unresolved });
          },
          onCommentCreate: comment => {
            console.log('New comment created:', comment);
          },
          onCommentClick: (comment, commentId) => {
            console.log('Comment text clicked:', commentId);
            setHighlightCommentId(commentId);
            setCommentDrawerVisible(true);
          },
          onShowCommentButton: ({ visible, position }) => {
            setCommentButtonVisible(visible);
            setCommentButtonPosition(position);
          },
          onHideCommentButton: () => {
            setCommentButtonVisible(false);
          },
          onShowCommentModal: ({ visible, selectedText, onSubmit }) => {
            console.log('Editor: onShowCommentModal called with:', {
              visible,
              selectedText,
              textLength: selectedText?.length || 0,
            });
            setSelectedTextForComment(selectedText);
            setCommentModalVisible(visible);
            // 直接存储提交回调函数到commentManager实例
            commentManager.currentSubmitCallback = onSubmit;
            console.log('Editor: Submit callback stored to commentManager');
          },
        });

        // 先赋值给ref，确保后续能访问到
        commentManagerRef.current = commentManager;

        // 确保回调函数能正确设置
        commentManager.setSubmitCallback = callback => {
          commentManager.currentSubmitCallback = callback;
        };
      }

      // 简化版本（备用）
      // const commentManager = new CommentManagerSimple(quill);
      // commentManagerRef.current = commentManager;

      // 添加字数统计功能
      const updateCounter = () => {
        const stats = calculateStats(quillRef);
        setCharacterCount(stats.characters);
        setWordCount(stats.words);
        setLineCount(stats.lines);
        setParagraphCount(stats.paragraphs);
      };

      quill.on('text-change', updateCounter);
      updateCounter(); // 初始化统计

      // 添加工具栏提示和自定义图标
      setTimeout(() => {
        addToolbarTooltips();
      }, 100);

      // 监听工具栏变化，重新添加提示
      const observer = new MutationObserver(() => {
        addToolbarTooltips();
      });

      const toolbar = document.querySelector('.ql-toolbar');
      if (toolbar) {
        observer.observe(toolbar, {
          childList: true,
          subtree: true,
        });
      }

      // 清理函数
      return () => {
        observer.disconnect();
        cleanupCollaboration(binding, provider);
        // 清理评论管理器
        if (commentManagerRef.current) {
          commentManagerRef.current.destroy();
        }
      };
    }
  }, [myColor]);

  // 处理用户名变化
  const handleUsernameChange = e => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    updateUsername(awarenessRef.current, newUsername, myColor);
  };

  // 文档操作处理函数
  const onSave = () => handleSave(quillRef, documentTitle, setSaveLoading);
  const onShare = () => handleShare(setShareUrl, setShareModalVisible);
  const onDownload = () => showDownloadMenu(quillRef.current);
  const onCopyUrl = () => copyShareUrl(shareUrl);
  const onGenerateSummary = () => showPDFMenu();

  // 评论处理函数
  const handleResolveComment = commentId => {
    if (commentManagerRef.current) {
      commentManagerRef.current.toggleResolveComment(commentId);
    }
  };

  const handleDeleteComment = commentId => {
    if (commentManagerRef.current) {
      commentManagerRef.current.deleteComment(commentId);
    }
  };

  const handleCommentClick = comment => {
    if (commentManagerRef.current) {
      commentManagerRef.current.highlightCommentText(comment);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <EditorHeader
        documentTitle={documentTitle}
        setDocumentTitle={setDocumentTitle}
        username={username}
        handleUsernameChange={handleUsernameChange}
        users={users}
        saveLoading={saveLoading}
        onSave={onSave}
        onShare={onShare}
        onDownload={onDownload}
        onGenerateSummary={onGenerateSummary}
      />

      <div className={styles.editorWrapper}>
        <div id="editor" ref={editorRef} className={styles.quillEditor} />
        <TextStats
          characterCount={characterCount}
          wordCount={wordCount}
          lineCount={lineCount}
          paragraphCount={paragraphCount}
        />
      </div>

      <ShareModal
        shareModalVisible={shareModalVisible}
        setShareModalVisible={setShareModalVisible}
        shareUrl={shareUrl}
        onCopyUrl={onCopyUrl}
      />

      <CommentDrawer
        visible={commentDrawerVisible}
        onClose={() => {
          setCommentDrawerVisible(false);
          setHighlightCommentId(null); // 关闭时清除高亮
        }}
        comments={comments}
        onResolveComment={handleResolveComment}
        onDeleteComment={handleDeleteComment}
        onCommentClick={handleCommentClick}
        highlightCommentId={highlightCommentId}
      />

      <CommentTrigger
        commentCount={commentStats.total}
        unresolvedCount={commentStats.unresolved}
        onClick={() => setCommentDrawerVisible(true)}
        visible={commentStats.total > 0}
      />

      <CommentButton
        visible={commentButtonVisible}
        position={commentButtonPosition}
        onClick={() => {
          console.log('CommentButton clicked, calling createComment');
          if (commentManagerRef.current) {
            commentManagerRef.current.createComment();
          }
        }}
      />

      <CommentModal
        visible={commentModalVisible}
        onCancel={() => setCommentModalVisible(false)}
        selectedText={selectedTextForComment}
        onSubmit={async comment => {
          // 调用CommentManager的提交回调
          if (
            commentManagerRef.current &&
            commentManagerRef.current.currentSubmitCallback
          ) {
            await commentManagerRef.current.currentSubmitCallback(comment);
          }
          setCommentModalVisible(false);
        }}
      />
    </div>
  );
};

export default Editor;
