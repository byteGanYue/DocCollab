import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import styles from './editor.module.less';
import 'quill/dist/quill.core.css';

// 导入配置和工具函数
import { TOOLBAR_CONFIG, USER_COLORS } from './toolbarConfig.js';
import { addToolbarStyles, addToolbarTooltips } from './toolbarUtils.js';
import { calculateStats } from './textStats.js';
import {
  handleSave,
  handleShare,
  copyShareUrl,
  handleDownload,
} from './documentActions.js';
import {
  initCollaboration,
  updateUsername,
  cleanupCollaboration,
} from './collaboration.js';

// 导入UI组件
import EditorHeader from './EditorHeader.jsx';
import TextStats from './TextStats.jsx';
import ShareModal from './ShareModal.jsx';

// 注册 Quill 光标模块
Quill.register('modules/cursors', QuillCursors);

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
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);

  // 保存和分享状态
  const [saveLoading, setSaveLoading] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [documentTitle, setDocumentTitle] = useState('未命名文档');

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
      const { binding, provider, awareness } = initCollaboration(
        quill,
        setUsername,
        setUsers,
        myColor,
      );
      bindingRef.current = binding;
      providerRef.current = provider;
      awarenessRef.current = awareness;

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
  const onDownload = () => handleDownload(quillRef, documentTitle);
  const onCopyUrl = () => copyShareUrl(shareUrl);

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
    </div>
  );
};

export default Editor;
