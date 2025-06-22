import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import styles from './editor.module.less';
import 'quill/dist/quill.core.css';
import FloatingToolbar from './FloatingToolbar.jsx';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  FontSizeOutlined,
  FontColorsOutlined,
  BgColorsOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  BlockOutlined,
  CodeOutlined,
  TableOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ClearOutlined,
  FontSizeOutlined as FontIcon,
  FontColorsOutlined as ColorIcon,
  BgColorsOutlined as BgColorIcon,
  DownOutlined,
} from '@ant-design/icons';
import BlockToolbar from './BlockToolbar.jsx';
import { Dropdown, Menu, Tooltip, Input, Button, Modal, Select } from 'antd';
import 'antd/dist/reset.css';
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
  TOOLBAR_TOOLTIPS,
} from '../../../../utils/index.js';
import './CodeBlockBlot.js';

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

const TOOLBAR_HEIGHT = 40;

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

  // 浮动工具栏状态
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ left: 0, top: 0 });

  // 块级工具栏状态
  const [blockToolbarVisible, setBlockToolbarVisible] = useState(false);
  const [blockToolbarPos, setBlockToolbarPos] = useState({ top: 0, left: 0 });
  const [blockLineIndex, setBlockLineIndex] = useState(null);
  const [blockToolbarExpanded, setBlockToolbarExpanded] = useState(false);
  // 新增：加号按钮悬停状态
  const [blockToolbarHover, setBlockToolbarHover] = useState(false);

  // 新增：代码块模态框状态
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeLang, setCodeLang] = useState('plaintext');

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

  // 浮动工具栏逻辑
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const updateToolbarPosition = range => {
      if (range && range.length > 0) {
        const bounds = quill.getBounds(range.index, range.length);
        const editorRect = quill.container.getBoundingClientRect();
        // 计算全局坐标
        const left = editorRect.left + bounds.left + window.scrollX;
        let top =
          editorRect.top + bounds.top + window.scrollY - TOOLBAR_HEIGHT - 8;
        // 边界处理：如果超出顶部则放在下方
        if (top < 0) top = editorRect.top + bounds.bottom + window.scrollY + 8;
        setToolbarPosition({ left, top });
        setToolbarVisible(true);
      } else {
        setToolbarVisible(false);
      }
    };

    const handleSelectionChange = range => {
      updateToolbarPosition(range);
    };

    quill.on('selection-change', handleSelectionChange);
    // 滚动/窗口变化时重新定位
    const handleWindowUpdate = () => {
      const range = quill.getSelection();
      updateToolbarPosition(range);
    };
    window.addEventListener('scroll', handleWindowUpdate, true);
    window.addEventListener('resize', handleWindowUpdate, true);

    return () => {
      quill.off('selection-change', handleSelectionChange);
      window.removeEventListener('scroll', handleWindowUpdate, true);
      window.removeEventListener('resize', handleWindowUpdate, true);
    };
  }, []);

  // 块级工具栏逻辑
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    // 监听selection-change
    const handleSelectionChange = range => {
      if (!range) {
        setBlockToolbarVisible(false);
        setBlockToolbarExpanded(false);
        return;
      }
      // 获取当前行的blot和DOM节点
      const [line] = quill.getLine(range.index);
      if (line && line.domNode) {
        const rect = line.domNode.getBoundingClientRect();
        setBlockToolbarVisible(true);
        setBlockToolbarPos({
          top: rect.top + rect.height / 2 - 16,
          left: rect.left - 44,
        });
        setBlockLineIndex(quill.getIndex(line));
      } else {
        setBlockToolbarVisible(false);
        setBlockToolbarExpanded(false);
      }
    };
    quill.on('selection-change', handleSelectionChange);
    return () => {
      quill.off('selection-change', handleSelectionChange);
    };
  }, [blockToolbarHover]);

  // 浮动工具栏操作
  const handleFormat = (format, value) => {
    const quill = quillRef.current;
    if (!quill) return;
    if (typeof value !== 'undefined') {
      quill.format(format, value);
    } else {
      quill.format(format, !quill.getFormat()[format]);
    }
  };

  const handleInsert = type => {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection();
    if (!range) return;
    if (type === 'image') {
      const url = window.prompt('请输入图片URL');
      if (url) quill.insertEmbed(range.index, 'image', url, 'user');
    } else if (type === 'video') {
      const url = window.prompt('请输入视频URL');
      if (url) quill.insertEmbed(range.index, 'video', url, 'user');
    } else if (type === 'table') {
      // 需要quill-table扩展支持，这里简单插入markdown表格
      quill.insertText(
        range.index,
        '\n| 表头1 | 表头2 |\n| --- | --- |\n| 内容1 | 内容2 |\n',
        'user',
      );
    }
  };

  const handleFont = font => handleFormat('font', font);
  const handleSize = size => handleFormat('size', size);
  const handleHeader = header => handleFormat('header', header);
  const handleAlign = align => handleFormat('align', align);
  const handleColor = color => handleFormat('color', color);
  const handleBgColor = color => handleFormat('background', color);
  const handleList = type => handleFormat('list', type);
  const handleIndent = type => handleFormat('indent', type);
  const handleLink = () => {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection();
    if (!range) return;
    const url = window.prompt('请输入链接URL');
    if (url) quill.format('link', url);
  };
  const handleBlockquote = () => handleFormat('blockquote');
  const handleClear = () => {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection();
    if (!range) return;
    quill.removeFormat(range.index, range.length);
  };

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

  // 块级工具栏操作
  const handleBlockInsert = () => {
    const quill = quillRef.current;
    if (!quill || blockLineIndex == null) return;
    quill.insertText(blockLineIndex, '\n', 'user');
    quill.setSelection(blockLineIndex + 1, 0, 'user');
    setBlockToolbarVisible(false);
    setBlockToolbarExpanded(false);
  };
  const handleBlockFormat = (format, value) => {
    const quill = quillRef.current;
    if (!quill || blockLineIndex == null) return;
    quill.formatLine(blockLineIndex, 1, format, value, 'user');
    setBlockToolbarVisible(false);
    setBlockToolbarExpanded(false);
  };

  // 插入自定义代码块
  const showCodeModal = () => {
    setCodeInput('');
    setCodeLang('plaintext');
    setCodeModalVisible(true);
  };

  const handleCodeModalOk = () => {
    const quill = quillRef.current;
    const range = quill.getSelection();
    quill.insertEmbed(
      range.index,
      'custom-code-block',
      { code: codeInput, language: codeLang },
      'user',
    );
    setCodeModalVisible(false);
  };

  const handleInsertCodeBlock = showCodeModal;

  // 工具栏按钮渲染映射
  const TOOLBAR_BUTTONS = {
    bold: {
      icon: <BoldOutlined />,
      handler: () => handleFormat('bold'),
    },
    italic: {
      icon: <ItalicOutlined />,
      handler: () => handleFormat('italic'),
    },
    underline: {
      icon: <UnderlineOutlined />,
      handler: () => handleFormat('underline'),
    },
    strike: {
      icon: <StrikethroughOutlined />,
      handler: () => handleFormat('strike'),
    },
    link: {
      icon: <LinkOutlined />,
      handler: handleLink,
    },
    blockquote: {
      icon: <BlockOutlined />,
      handler: handleBlockquote,
    },
    'code-block': {
      icon: <CodeOutlined />,
      handler: handleInsertCodeBlock,
    },
    table: {
      icon: <TableOutlined />,
      handler: () => handleInsert('table'),
    },
    image: {
      icon: <PictureOutlined />,
      handler: () => handleInsert('image'),
    },
    video: {
      icon: <VideoCameraOutlined />,
      handler: () => handleInsert('video'),
    },
    clean: {
      icon: <ClearOutlined />,
      handler: handleClear,
    },
  };

  return (
    <div className={styles.editorContainer}>
      {/* 块级浮动工具栏 */}
      <BlockToolbar
        visible={blockToolbarVisible}
        top={blockToolbarPos.top}
        left={blockToolbarPos.left}
        onInsert={handleBlockInsert}
        onFormat={handleBlockFormat}
        expanded={blockToolbarExpanded}
        onExpand={() => setBlockToolbarExpanded(exp => !exp)}
        onMouseEnter={() => setBlockToolbarHover(true)}
        onMouseLeave={() => {
          setBlockToolbarHover(false);
          setBlockToolbarVisible(false);
          setBlockToolbarExpanded(false);
        }}
      />
      {/* 浮动工具栏 */}
      <FloatingToolbar visible={toolbarVisible} position={toolbarPosition}>
        {TOOLBAR_CONFIG.flat().map((item, idx) => {
          if (typeof item === 'string') {
            // 普通按钮
            const btn = TOOLBAR_BUTTONS[item];
            if (!btn) return null;
            return (
              <Tooltip title={TOOLBAR_TOOLTIPS[item] || item} key={item + idx}>
                <span
                  style={{ cursor: 'pointer', fontSize: 18 }}
                  onClick={btn.handler}
                >
                  {btn.icon}
                </span>
              </Tooltip>
            );
          } else if (typeof item === 'object') {
            // 下拉类
            if (item.font) {
              return (
                <Dropdown
                  key={'font' + idx}
                  overlay={
                    <Menu onClick={({ key }) => handleFont(key)}>
                      <Menu.Item key="sans-serif">默认</Menu.Item>
                      <Menu.Item key="serif">衬线</Menu.Item>
                      <Menu.Item key="monospace">等宽</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="字体">
                    <FontIcon style={{ fontSize: 18, cursor: 'pointer' }} />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.header) {
              return (
                <Dropdown
                  key={'header' + idx}
                  overlay={
                    <Menu onClick={({ key }) => handleHeader(Number(key))}>
                      <Menu.Item key="1">H1</Menu.Item>
                      <Menu.Item key="2">H2</Menu.Item>
                      <Menu.Item key="3">H3</Menu.Item>
                      <Menu.Item key="4">H4</Menu.Item>
                      <Menu.Item key="5">H5</Menu.Item>
                      <Menu.Item key="6">H6</Menu.Item>
                      <Menu.Item key="0">正文</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="标题">
                    <FontSizeOutlined
                      style={{ fontSize: 18, cursor: 'pointer' }}
                    />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.size) {
              return (
                <Dropdown
                  key={'size' + idx}
                  overlay={
                    <Menu onClick={({ key }) => handleSize(key)}>
                      <Menu.Item key="small">小</Menu.Item>
                      <Menu.Item key="normal">正常</Menu.Item>
                      <Menu.Item key="large">大</Menu.Item>
                      <Menu.Item key="huge">特大</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="字号">
                    <FontSizeOutlined
                      style={{ fontSize: 18, cursor: 'pointer' }}
                    />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.color) {
              return (
                <Dropdown
                  key={'color' + idx}
                  overlay={
                    <Menu onClick={({ key }) => handleColor(key)}>
                      <Menu.Item key="#000000">黑色</Menu.Item>
                      <Menu.Item key="#e60000">红色</Menu.Item>
                      <Menu.Item key="#ff9900">橙色</Menu.Item>
                      <Menu.Item key="#ffff00">黄色</Menu.Item>
                      <Menu.Item key="#008a00">绿色</Menu.Item>
                      <Menu.Item key="#0066cc">蓝色</Menu.Item>
                      <Menu.Item key="#9933ff">紫色</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="文字颜色">
                    <ColorIcon style={{ fontSize: 18, cursor: 'pointer' }} />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.background) {
              return (
                <Dropdown
                  key={'background' + idx}
                  overlay={
                    <Menu onClick={({ key }) => handleBgColor(key)}>
                      <Menu.Item key="#ffffff">白色</Menu.Item>
                      <Menu.Item key="#f4cccc">浅红</Menu.Item>
                      <Menu.Item key="#fff2cc">浅黄</Menu.Item>
                      <Menu.Item key="#d9ead3">浅绿</Menu.Item>
                      <Menu.Item key="#cfe2f3">浅蓝</Menu.Item>
                      <Menu.Item key="#ead1dc">浅紫</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="背景色">
                    <BgColorIcon style={{ fontSize: 18, cursor: 'pointer' }} />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.align) {
              return (
                <Dropdown
                  key={'align' + idx}
                  overlay={
                    <Menu onClick={({ key }) => handleAlign(key)}>
                      <Menu.Item key="left">左对齐</Menu.Item>
                      <Menu.Item key="center">居中</Menu.Item>
                      <Menu.Item key="right">右对齐</Menu.Item>
                      <Menu.Item key="justify">两端对齐</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="对齐方式">
                    <AlignLeftOutlined
                      style={{ fontSize: 18, cursor: 'pointer' }}
                    />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.list) {
              return item.list === 'ordered' ? (
                <Tooltip title="有序列表" key={'list-ordered' + idx}>
                  <OrderedListOutlined
                    onClick={() => handleList('ordered')}
                    style={{ fontSize: 18, cursor: 'pointer' }}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="无序列表" key={'list-bullet' + idx}>
                  <UnorderedListOutlined
                    onClick={() => handleList('bullet')}
                    style={{ fontSize: 18, cursor: 'pointer' }}
                  />
                </Tooltip>
              );
            }
            if (item.indent) {
              return item.indent === '+1' ? (
                <Tooltip title="增加缩进" key={'indent+1' + idx}>
                  <Button
                    size="small"
                    shape="circle"
                    icon={<DownOutlined />}
                    onClick={() => handleIndent('+1')}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="减少缩进" key={'indent-1' + idx}>
                  <Button
                    size="small"
                    shape="circle"
                    icon={<DownOutlined />}
                    onClick={() => handleIndent('-1')}
                  />
                </Tooltip>
              );
            }
            // 其他未覆盖的类型
            return null;
          }
          return null;
        })}
      </FloatingToolbar>
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
        onCancel={() => {
          // 重置CommentManager的模态框状态
          if (commentManagerRef.current) {
            commentManagerRef.current.isCommentModalOpen = false;
            // 清理临时存储的数据
            commentManagerRef.current.currentSelectedText = null;
            commentManagerRef.current.currentSelectedRange = null;
          }
          setCommentModalVisible(false);
        }}
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

      <Modal
        title="插入代码块"
        open={codeModalVisible}
        onOk={handleCodeModalOk}
        onCancel={() => setCodeModalVisible(false)}
        okText="插入"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <span>语言：</span>
          <Select
            value={codeLang}
            onChange={setCodeLang}
            style={{ width: 180 }}
            options={[
              { value: 'plaintext', label: 'Plain Text' },
              { value: 'javascript', label: 'JavaScript' },
              { value: 'json', label: 'JSON' },
              { value: 'java', label: 'Java' },
              { value: 'python', label: 'Python' },
              { value: 'c', label: 'C' },
              { value: 'cpp', label: 'C++' },
              { value: 'html', label: 'HTML' },
              { value: 'css', label: 'CSS' },
            ]}
          />
        </div>
        <Input.TextArea
          value={codeInput}
          onChange={e => setCodeInput(e.target.value)}
          autoSize={{ minRows: 6, maxRows: 16 }}
          placeholder="请输入代码内容"
        />
      </Modal>
    </div>
  );
};

export default Editor;
