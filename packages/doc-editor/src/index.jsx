import React, { useCallback, useMemo } from 'react';
import isHotkey from 'is-hotkey';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, withReact } from 'slate-react';
import { Toolbar, MarkButton, BlockButton, Element, Leaf } from './components';
import { HOTKEYS, toggleMark } from './utils/editorHelpers';

/**
 * 富文本编辑器 SDK 组件
 * 基于 Slate.js 构建的功能完整的富文本编辑器
 */
const EditorSDK = () => {
  // 创建编辑器实例，结合历史记录和React支持
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  // 渲染元素的回调函数
  const renderElement = useCallback(props => <Element {...props} />, []);

  // 渲染叶子节点的回调函数
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  // 初始化编辑器内容
  const initialValue = useMemo(
    () => [
      {
        type: 'paragraph',
        children: [
          { text: '这是可编辑的 ' },
          { text: '富文本编辑器', bold: true },
          { text: '，比 ' },
          { text: 'textarea', italic: true },
          { text: ' 更好', code: true },
          { text: '!' },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '由于它是富文本，你可以执行诸如将选定的文本 ',
          },
          { text: '加粗', bold: true },
          {
            text: '，或者在页面中间添加一个语义化的引用块，就像这样：',
          },
        ],
      },
      {
        type: 'block-quote',
        children: [{ text: '一个明智的引用。' }],
      },
      {
        type: 'paragraph',
        align: 'center',
        children: [{ text: '试试看吧！' }],
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

      {/* 使用说明 */}
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#495057',
          border: '1px solid #e9ecef',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', color: '#212529' }}>
          富文本编辑器功能说明
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <div>
            <strong>键盘快捷键：</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>
                <kbd>Ctrl/Cmd + B</kbd> - 粗体
              </li>
              <li>
                <kbd>Ctrl/Cmd + I</kbd> - 斜体
              </li>
              <li>
                <kbd>Ctrl/Cmd + U</kbd> - 下划线
              </li>
              <li>
                <kbd>Ctrl/Cmd + `</kbd> - 代码
              </li>
            </ul>
          </div>
          <div>
            <strong>工具栏功能：</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>文本格式化（粗体、斜体、下划线、代码）</li>
              <li>标题设置（H1、H2）</li>
              <li>引用块、列表（有序、无序）</li>
              <li>文本对齐（左、中、右、两端对齐）</li>
            </ul>
          </div>
        </div>
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
    </div>
  );
};

export { EditorSDK };
export default EditorSDK;
