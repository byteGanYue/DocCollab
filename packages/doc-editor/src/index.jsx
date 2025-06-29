import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import isHotkey from 'is-hotkey';
import Prism from 'prismjs';
// 导入Prism.js的各种语言支持
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
import { Element, Node, Text, Editor, Range } from 'slate';
import { Editable, Slate } from 'slate-react';
import {
  Toolbar,
  MarkButton,
  BlockButton,
  Element as ElementComponent,
  Leaf,
  HelpModal,
  CodeBlockButton,
  HoveringToolbar,
  ColorButton,
  AIDrawer,
} from './components';
import { HOTKEYS, toggleMark } from './utils/editorHelpers';
import { normalizeTokens } from './utils/normalize-tokens';
import { prismThemeCss } from './utils/prismTheme';

// 协同相关
import CursorOverlay from './components/CursorOverlay';
import { useCollaborativeEditor } from './hooks/useCollaborativeEditor';
import StatusIndicator from './components/StatusIndicator';
import UserAvatars from './components/UserAvatars';
import ActionButtons from './components/ActionButtons';
import CommentModal from './components/CommentModal';
import * as Y from 'yjs';
import CommentList from './components/CommentList';

// 常量定义
const ParagraphType = 'paragraph';
const CodeBlockType = 'code-block';
const CodeLineType = 'code-line';
const WS_URL = 'ws://127.0.0.1:1234'; // WebSocket服务器地址

// 创建文本节点的辅助函数
const toChildren = content => [{ text: content }];

// 将字符串转换为代码行数组
const toCodeLines = content =>
  content
    .split('\n')
    .map(line => ({ type: CodeLineType, children: toChildren(line) }));

// 简化的初始编辑器内容 (提升到组件外)
const defaultInitialValue = [
  {
    type: 'paragraph',
    children: [{ text: '协同编辑器示例' }],
  },
];

/**
 * 富文本编辑器 SDK 组件
 * 基于 Slate.js 构建的功能完整的富文本编辑器
 * 实现强制布局：文档始终有标题和至少一个段落
 * 支持代码高亮功能
 * 支持多用户实时协同编辑
 */
const EditorSDK = ({
  documentId = 'default-document',
  value: externalValue,
  onChange: externalOnChange,
}) => {
  // 使用自定义 hook 管理协同编辑器状态
  const {
    editor,
    value: internalValue,
    setValue: setInternalValue,
    isConnected,
    onlineUsers,
    remoteUsers,
    showHelpModal,
    setShowHelpModal,
    showAIDrawer,
    setShowAIDrawer,
    handleOpenAIDrawer,
    handleCloseAIDrawer,
    comments,
    addComment,
    deleteComment,
    resolveComment,
    navigateToComment,
    yComments,
    printYjsStructure,
  } = useCollaborativeEditor(documentId);
  // value 就是当前文档内容（Slate节点数组）
  // 优先使用外部传入的 value
  const value = externalValue !== undefined ? externalValue : internalValue;
  const setValue = externalOnChange || setInternalValue;
  console.log('当前文档内容（Slate节点数组）', value);
  // 评论弹窗相关状态
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentSelection, setCommentSelection] = useState(null);

  // 记录选区
  const editorSelectionRef = useRef(null);

  // 辅助：全局 index 转 Slate path/offset
  const getSlateRangeFromGlobalIndex = (editor, startIndex, endIndex) => {
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
    return anchor && focus ? { anchor, focus } : null;
  };

  // 辅助：将 Slate path+offset 转为全局 index
  const getGlobalIndex = (editor, path, offset) => {
    let index = 0;
    for (const [node, p] of Node.texts(editor)) {
      if (p.toString() === path.toString()) {
        index += offset;
        break;
      }
      index += Node.string(node).length;
    }
    return index;
  };

  // 代码高亮装饰器函数，增加评论高亮
  function decorate([node, path]) {
    let decorations = [];
    if (!node || !path) return decorations;
    if (Element.isElement(node) && node.type === CodeBlockType) {
      decorations = decorations.concat(decorateCodeBlock([node, path]));
    }
    // 注意：评论高亮现在通过 Editor.addMark 直接添加到文本上，不再需要在这里处理
    return decorations;
  }

  // 为代码块应用语法高亮装饰
  const decorateCodeBlock = ([block, blockPath]) => {
    try {
      const text = block.children.map(line => Node.string(line)).join('\n');
      const language = block.language || 'html';
      if (!Prism.languages[language]) {
        return [];
      }
      const tokens = Prism.tokenize(text, Prism.languages[language]);
      const normalizedTokens = normalizeTokens(tokens);
      const decorations = [];
      for (let index = 0; index < normalizedTokens.length; index++) {
        const tokens = normalizedTokens[index];
        let start = 0;
        for (const token of tokens) {
          const length = token.content.length;
          if (!length) continue;
          const end = start + length;
          const path = [...blockPath, index, 0];
          const decoration = {
            anchor: { path, offset: start },
            focus: { path, offset: end },
            token: true,
          };
          token.types.forEach(type => {
            decoration[type] = true;
          });
          decorations.push(decoration);
          start = end;
        }
      }
      return decorations;
    } catch (error) {
      console.error('代码高亮处理失败:', error);
      return [];
    }
  };

  // Tab键处理函数
  const onKeyDown = useCallback(
    event => {
      try {
        if (isHotkey('tab', event)) {
          event.preventDefault();
          editor.insertText('  ');
          return;
        }

        // 添加评论快捷键 Ctrl+Shift+C
        if (isHotkey('mod+shift+c', event)) {
          event.preventDefault();
          if (!editor.selection || Range.isCollapsed(editor.selection)) {
            alert('请先选中要评论的文本');
            return;
          }
          // 保存当前选区
          editorSelectionRef.current = { ...editor.selection };
          setShowCommentModal(true);
          return;
        }

        for (const hotkey in HOTKEYS) {
          if (isHotkey(hotkey, event)) {
            event.preventDefault();
            const mark = HOTKEYS[hotkey];
            toggleMark(editor, mark);
          }
        }
      } catch (error) {
        console.error('键盘事件处理失败:', error);
      }
    },
    [editor],
  );

  // 渲染元素的回调函数
  const renderElement = useCallback(
    props => <ElementComponent {...props} />,
    [],
  );
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  // 编辑器状态更新处理
  const handleSlateChange = useCallback(
    newValue => {
      try {
        if (!newValue || !Array.isArray(newValue)) {
          console.warn('接收到无效的编辑器值:', newValue);
          return;
        }
        setValue(newValue);
      } catch (error) {
        console.error('更新编辑器状态失败:', error);
      }
    },
    [setValue],
  );

  // 评论弹窗确认
  const handleCommentOk = content => {
    if (!editorSelectionRef.current) return;

    // 直接使用保存的选区，不再计算全局索引
    const { anchor, focus } = editorSelectionRef.current;

    // 为了兼容 Yjs 协同，仍然计算全局索引
    const startIndex = getGlobalIndex(editor, anchor.path, anchor.offset);
    const endIndex = getGlobalIndex(editor, focus.path, focus.offset);
    console.log('startIndex', startIndex, 'endIndex', endIndex);
    console.log('content', content);

    // 添加评论
    const success = addComment(
      Math.min(startIndex, endIndex),
      Math.max(startIndex, endIndex),
      content,
      '用户A',
    );

    if (success) {
      setShowCommentModal(false);
      editorSelectionRef.current = null;
    } else {
      alert('该文本范围已有评论，请选择其他文本');
    }
  };

  // 处理评论删除
  const handleDeleteComment = useCallback(
    commentId => {
      const success = deleteComment(commentId);
      if (success) {
        console.log('评论删除成功');
      } else {
        console.error('评论删除失败');
      }
    },
    [deleteComment],
  );

  // 处理评论解决
  const handleResolveComment = useCallback(
    commentId => {
      const success = resolveComment(commentId);
      if (success) {
        console.log('评论解决成功');
      } else {
        console.error('评论解决失败');
      }
    },
    [resolveComment],
  );

  // 处理评论定位
  const handleNavigateToComment = useCallback(
    comment => {
      const success = navigateToComment(comment);
      if (success) {
        console.log('定位到评论位置成功');
      } else {
        console.error('定位到评论位置失败');
      }
    },
    [navigateToComment],
  );

  // 处理清空所有评论
  const handleClearAllComments = useCallback(() => {
    if (yComments.current) {
      yComments.current.delete(0, yComments.current.length);
      console.log('清空所有评论');
    }
  }, [yComments]);

  return (
    <div
      style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      {/* 添加Material Icons字体 */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
      {/* Prism主题样式 */}
      <style>{prismThemeCss}</style>
      {/* 协同光标样式 */}
      <style>{`
        .cursors { position: relative; }
        .caretMarker { position: absolute; width: 2px; z-index: 10; }
        .caret { position: absolute; font-size: 14px; color: #fff; white-space: nowrap; top: 0; border-radius: 6px; border-bottom-left-radius: 0; padding: 2px 6px; pointer-events: none; }
        .selection { position: absolute; pointer-events: none; opacity: 0.2; z-index: 5; }
      `}</style>

      {/* 连接状态指示器 */}
      <StatusIndicator isConnected={isConnected} documentId={documentId} />

      {/* 操作按钮区域 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '16px',
          backgroundColor: '#f8f9fa',
          margin: '0px -16px 0px',
          padding: '5px 16px',
        }}
      >
        {/* 左侧显示协作状态 */}
        <UserAvatars
          isConnected={isConnected}
          onlineUsers={onlineUsers}
          remoteUsers={remoteUsers}
        />
        {/* 右侧操作按钮 */}
        <ActionButtons
          onCancel={() => {}}
          onSave={() => {}}
          onAI={handleOpenAIDrawer}
          onHelp={() => setShowHelpModal(true)}
        />
      </div>

      <Slate
        editor={editor}
        initialValue={value}
        onChange={handleSlateChange}
        value={value}
      >
        {/* 悬浮工具栏 */}
        <HoveringToolbar
          onAddComment={() => {
            if (!editor.selection || Range.isCollapsed(editor.selection)) {
              alert('请先选中要评论的文本');
              return;
            }
            // 保存当前选区
            editorSelectionRef.current = { ...editor.selection };
            setShowCommentModal(true);
          }}
        />

        {/* 工具栏 */}
        <Toolbar>
          {/* 文本格式化按钮 */}
          <MarkButton format="bold" icon="format_bold" />
          <MarkButton format="italic" icon="format_italic" />
          <MarkButton format="underline" icon="format_underlined" />
          <MarkButton format="strikethrough" icon="strikethrough_s" />
          <MarkButton format="code" icon="code" />

          {/* 分隔符 */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#ddd',
              margin: '0 4px',
            }}
          />

          {/* 文本颜色和高亮 */}
          <ColorButton icon="format_color_text" type="color" />
          <ColorButton icon="highlight" type="backgroundColor" />

          {/* 分隔符 */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#ddd',
              margin: '0 4px',
            }}
          />

          {/* 块级元素按钮 */}
          <BlockButton format="heading-one" icon="looks_one" />
          <BlockButton format="heading-two" icon="looks_two" />
          <BlockButton format="block-quote" icon="format_quote" />
          {/* 代码块按钮 */}
          <CodeBlockButton />

          {/* 分隔符 */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#ddd',
              margin: '0 4px',
            }}
          />

          {/* 列表按钮 */}
          <BlockButton format="numbered-list" icon="format_list_numbered" />
          <BlockButton format="bulleted-list" icon="format_list_bulleted" />

          {/* 分隔符 */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#ddd',
              margin: '0 4px',
            }}
          />

          {/* 对齐按钮 */}
          <BlockButton format="left" icon="format_align_left" />
          <BlockButton format="center" icon="format_align_center" />
          <BlockButton format="right" icon="format_align_right" />
          <BlockButton format="justify" icon="format_align_justify" />
          {/* 评论按钮 */}
          <button
            type="button"
            style={{
              marginLeft: 8,
              padding: '0 12px',
              border: '1px solid #aaa',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
              height: 32,
            }}
            onClick={() => {
              if (!editor.selection || Range.isCollapsed(editor.selection)) {
                alert('请先选中要评论的文本');
                return;
              }
              // 保存当前选区
              editorSelectionRef.current = { ...editor.selection };
              setShowCommentModal(true);
            }}
          >
            <span
              className="material-icons"
              style={{ fontSize: 18, verticalAlign: 'middle' }}
            >
              mode_comment
            </span>{' '}
            评论
          </button>

          {/* 调试按钮 - 打印 Yjs 结构 */}
          <button
            type="button"
            style={{
              marginLeft: 8,
              padding: '0 12px',
              border: '1px solid #ff9800',
              borderRadius: 4,
              background: '#fff',
              color: '#ff9800',
              cursor: 'pointer',
              height: 32,
              fontSize: '12px',
            }}
            onClick={() => {
              printYjsStructure();
              console.log('=== 当前评论状态 ===');
              console.log('本地评论数组:', comments);
              console.log('评论数量:', comments.length);
              console.log('==================');
            }}
            title="打印 Yjs 协同数据结构"
          >
            🔍 调试
          </button>
        </Toolbar>

        {/* 编辑区域 + 协同光标覆盖层 */}
        <CursorOverlay>
          <Editable
            decorate={decorate}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="在这里输入内容..."
            spellCheck
            autoFocus
            style={{
              minHeight: '300px',
              padding: '16px',
              border: '1px solid #ced4da',
              borderRadius: '0 0 8px 8px',
              fontSize: '16px',
              lineHeight: '1.5',
              outline: 'none',
              backgroundColor: '#fff',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
            }}
            onKeyDown={onKeyDown}
          />
        </CursorOverlay>
      </Slate>

      {/* 提示服务器未运行 */}
      {!isConnected && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#ffe0e0',
            borderRadius: '6px',
            color: '#c62828',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            <span
              className="material-icons"
              style={{
                fontSize: '16px',
                marginRight: '4px',
                verticalAlign: 'text-bottom',
              }}
            >
              warning
            </span>
            协同服务器未运行
          </div>
          <p>
            请先启动WebSocket服务器，运行: <code>node server.js</code>
          </p>
          <p>当前正在本地模式编辑，无法与其他用户实时协作。</p>
        </div>
      )}

      {/* 帮助弹窗 */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* AI摘要抽屉 */}
      <AIDrawer
        isOpen={showAIDrawer}
        onClose={handleCloseAIDrawer}
        documentContent={value}
      />

      <CommentModal
        isOpen={showCommentModal}
        onOk={handleCommentOk}
        onCancel={() => setShowCommentModal(false)}
      />

      <CommentList
        comments={comments}
        onDeleteComment={handleDeleteComment}
        onResolveComment={handleResolveComment}
        onNavigateToComment={handleNavigateToComment}
        onClearAllComments={handleClearAllComments}
        editor={editor}
      />
    </div>
  );
};

export { EditorSDK };
export default EditorSDK;
