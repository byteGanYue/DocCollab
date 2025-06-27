import React, { useCallback, useMemo, useState } from 'react';
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
import { createEditor, Element, Node } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, withReact } from 'slate-react';
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
import { HOTKEYS, toggleMark, withLayout } from './utils/editorHelpers';
import { normalizeTokens } from './utils/normalize-tokens';
import { prismThemeCss } from './utils/prismTheme';

// 常量定义
const ParagraphType = 'paragraph';
const CodeBlockType = 'code-block';
const CodeLineType = 'code-line';

/**
 * 富文本编辑器 SDK 组件
 * 基于 Slate.js 构建的功能完整的富文本编辑器
 * 实现强制布局：文档始终有标题和至少一个段落
 * 支持代码高亮功能
 */
const EditorSDK = () => {
  // 弹窗状态管理
  const [showHelpModal, setShowHelpModal] = useState(false);
  // AI抽屉状态管理
  const [showAIDrawer, setShowAIDrawer] = useState(false);

  // 创建编辑器实例，结合强制布局、历史记录和React支持
  const editor = useMemo(
    () => withLayout(withHistory(withReact(createEditor()))),
    [],
  );

  /**
   * 代码高亮装饰器函数
   * 为代码块中的内容应用语法高亮
   * @param {Array} nodeEntry - [node, path] 节点和路径
   * @returns {Array} 装饰范围数组
   */
  const decorate = useCallback(([node, path]) => {
    if (Element.isElement(node) && node.type === CodeBlockType) {
      return decorateCodeBlock([node, path]);
    }
    return [];
  }, []);

  /**
   * 为代码块应用语法高亮装饰
   * @param {Array} blockEntry - [block, blockPath] 代码块节点和路径
   * @returns {Array} 装饰范围数组
   */
  const decorateCodeBlock = ([block, blockPath]) => {
    // 提取代码块的文本内容
    const text = block.children.map(line => Node.string(line)).join('\n');

    // 获取语言支持，默认为HTML
    const language = block.language || 'html';

    // 检查Prism是否支持该语言
    if (!Prism.languages[language]) {
      return [];
    }

    // 使用Prism进行语法分析
    const tokens = Prism.tokenize(text, Prism.languages[language]);

    // 标准化token结构
    const normalizedTokens = normalizeTokens(tokens);

    const decorations = [];

    // 为每一行的每个token创建装饰
    for (let index = 0; index < normalizedTokens.length; index++) {
      const tokens = normalizedTokens[index];

      let start = 0;
      for (const token of tokens) {
        const length = token.content.length;
        if (!length) {
          continue;
        }

        const end = start + length;
        const path = [...blockPath, index, 0];

        // 创建装饰对象
        const decoration = {
          anchor: { path, offset: start },
          focus: { path, offset: end },
          token: true,
        };

        // 为每个token类型添加对应的属性
        token.types.forEach(type => {
          decoration[type] = true;
        });

        decorations.push(decoration);
        start = end;
      }
    }

    return decorations;
  };

  /**
   * Tab键处理函数
   * @param {KeyboardEvent} event - 键盘事件
   */
  const onKeyDown = useCallback(
    event => {
      // 处理Tab键，在代码块中插入空格
      if (isHotkey('tab', event)) {
        event.preventDefault();
        editor.insertText('  ');
        return;
      }

      // 处理其他快捷键
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, event)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey];
          toggleMark(editor, mark);
        }
      }
    },
    [editor],
  );

  // 渲染元素的回调函数
  const renderElement = useCallback(
    props => <ElementComponent {...props} />,
    [],
  );

  // 渲染叶子节点的回调函数
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  /**
   * 创建文本节点的辅助函数
   * @param {string} content - 文本内容
   * @returns {Array} 包含文本的children数组
   */
  const toChildren = content => [{ text: content }];

  /**
   * 将字符串转换为代码行数组
   * @param {string} content - 代码内容
   * @returns {Array} 代码行数组
   */
  const toCodeLines = content =>
    content
      .split('\n')
      .map(line => ({ type: CodeLineType, children: toChildren(line) }));

  // 初始化编辑器内容 - 包含强制布局的标题和段落，以及代码块示例
  const initialValue = useMemo(
    () => [
      {
        type: 'title',
        children: [{ text: '代码高亮文档示例' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '这是一个支持代码高亮的文档示例。你可以使用工具栏中的代码块按钮插入代码块。',
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
        type: 'paragraph',
        children: [
          {
            text: '💡 提示：选中这段文本试试悬浮工具栏功能！你会看到一个深色的工具栏出现在选中文本的上方，包含格式化按钮。',
          },
        ],
      },
      {
        type: CodeBlockType,
        language: 'jsx',
        children: toCodeLines(`// React组件示例
const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>计数器: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
};`),
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '代码块支持多种编程语言的语法高亮，你可以通过右上角的语言选择器切换语言。',
          },
        ],
      },
    ],
    [],
  );
  // 编辑器内容状态
  const [editorContent, setEditorContent] = useState(initialValue);

  // 处理编辑器内容变化的回调函数
  const handleEditorChange = value => {
    setEditorContent(value);
    console.log('编辑器内容更新:', value);
  };

  // 打开AI摘要抽屉
  const handleOpenAIDrawer = () => {
    setShowAIDrawer(true);
  };

  // 关闭AI摘要抽屉
  const handleCloseAIDrawer = () => {
    setShowAIDrawer(false);
  };

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
      {/* Prism主题样式 */}
      <style>{prismThemeCss}</style>

      {/* 操作按钮区域 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          // marginBottom: '16px',
          paddingBottom: '16px',
          // borderBottom: '1px solid #e9ecef',
          backgroundColor: '#f8f9fa',
          margin: '0px -16px 0px',
          padding: '5px 0px',
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
          onClick={handleOpenAIDrawer}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #6610f2',
            borderRadius: '6px',
            backgroundColor: '#6610f2',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            outline: 'none',
            minWidth: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = '#520dc2';
            e.target.style.borderColor = '#4709ac';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(102, 16, 242, 0.25)';
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = '#6610f2';
            e.target.style.borderColor = '#6610f2';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            auto_awesome
          </span>
          AI摘要
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
        onChange={handleEditorChange}
      >
        {/* 悬浮工具栏 */}
        <HoveringToolbar />

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
        </Toolbar>

        {/* 编辑区域 */}
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
      </Slate>

      {/* 帮助弹窗 */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* AI摘要抽屉 */}
      <AIDrawer
        isOpen={showAIDrawer}
        onClose={handleCloseAIDrawer}
        documentContent={editorContent}
      />
    </div>
  );
};

export { EditorSDK };
export default EditorSDK;
