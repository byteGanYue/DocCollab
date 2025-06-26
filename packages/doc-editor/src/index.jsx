import React, { useCallback, useMemo, useState } from 'react';
import isHotkey from 'is-hotkey';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, withReact } from 'slate-react';
import {
  Toolbar,
  MarkButton,
  BlockButton,
  Element,
  Leaf,
  HelpModal,
} from './components';
import { HOTKEYS, toggleMark, withLayout } from './utils/editorHelpers';

/**
 * 富文本编辑器 SDK 组件
 * 基于 Slate.js 构建的功能完整的富文本编辑器
 * 实现强制布局：文档始终有标题和至少一个段落
 */
const EditorSDK = () => {
  // 弹窗状态管理
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 创建编辑器实例，结合强制布局、历史记录和React支持
  const editor = useMemo(
    () => withLayout(withHistory(withReact(createEditor()))),
    [],
  );

  // 渲染元素的回调函数
  const renderElement = useCallback(props => <Element {...props} />, []);

  // 渲染叶子节点的回调函数
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  // 初始化编辑器内容 - 包含强制布局的标题和段落
  const initialValue = useMemo(
    () => [
      {
        type: 'title',
        children: [{ text: '强制布局文档示例' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '这是一个强制布局的文档示例。文档始终会在顶部保持一个标题，并且至少有一个段落。',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '即使你删除了标题和段落，编辑器也会自动创建新的标题和段落。试试看删除所有内容会发生什么！',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          { text: '你仍然可以使用所有的富文本功能，比如 ' },
          { text: '粗体', bold: true },
          { text: '、' },
          { text: '斜体', italic: true },
          { text: '、' },
          { text: '下划线', underline: true },
          { text: ' 和 ' },
          { text: '代码', code: true },
          { text: '。' },
        ],
      },
      {
        type: 'block-quote',
        children: [{ text: '引用块和其他格式也完全支持。' }],
      },
    ],
    [],
  );

  return (
    <div
      style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* 添加Material Icons字体 */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
      {/* 操作按钮区域 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e9ecef',
        }}
      >
        <button
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            backgroundColor: '#f8f9fa',
            color: '#6c757d',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            outline: 'none',
            minWidth: '80px',
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = '#e9ecef';
            e.target.style.borderColor = '#adb5bd';
            e.target.style.color = '#495057';
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.borderColor = '#dee2e6';
            e.target.style.color = '#6c757d';
          }}
          onMouseDown={e => {
            e.target.style.transform = 'scale(0.98)';
          }}
          onMouseUp={e => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          取消
        </button>
        <button
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #0d6efd',
            borderRadius: '6px',
            backgroundColor: '#0d6efd',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            outline: 'none',
            minWidth: '80px',
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = '#0b5ed7';
            e.target.style.borderColor = '#0a58ca';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(13, 110, 253, 0.25)';
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = '#0d6efd';
            e.target.style.borderColor = '#0d6efd';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
          onMouseDown={e => {
            e.target.style.transform = 'translateY(-1px) scale(0.98)';
          }}
          onMouseUp={e => {
            e.target.style.transform = 'translateY(-1px) scale(1)';
          }}
        >
          保存
        </button>
        <button
          onClick={() => setShowHelpModal(true)}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #6c757d',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#6c757d',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            outline: 'none',
            minWidth: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.borderColor = '#495057';
            e.target.style.color = '#495057';
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = '#ffffff';
            e.target.style.borderColor = '#6c757d';
            e.target.style.color = '#6c757d';
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            help_outline
          </span>
          使用说明
        </button>
      </div>
      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={value => {
          // 这里可以添加内容变更的处理逻辑
          console.log('编辑器内容更新:', value);
        }}
      >
        {/* 工具栏 */}
        <Toolbar>
          {/* 文本格式化按钮 */}
          <MarkButton format="bold" icon="format_bold" />
          <MarkButton format="italic" icon="format_italic" />
          <MarkButton format="underline" icon="format_underlined" />
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

          {/* 块级元素按钮 */}
          <BlockButton format="heading-one" icon="looks_one" />
          <BlockButton format="heading-two" icon="looks_two" />
          <BlockButton format="block-quote" icon="format_quote" />

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
        </Toolbar>

        {/* 编辑区域 */}
        <Editable
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
          onKeyDown={event => {
            // 处理键盘快捷键
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey];
                toggleMark(editor, mark);
              }
            }
          }}
        />
      </Slate>

      {/* 帮助弹窗 */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};

export { EditorSDK };
export default EditorSDK;
