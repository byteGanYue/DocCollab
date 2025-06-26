import React, { useCallback, useMemo } from 'react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, Slate, withReact } from 'slate-react';
import { HoveringToolbar, Element, Leaf } from '../components';
import { withLayout } from '../utils/editorHelpers';

/**
 * 悬浮工具栏示例组件
 * 演示当用户选中文本时显示悬浮工具栏的功能
 */
const HoveringToolbarExample = () => {
  // 创建编辑器实例
  const editor = useMemo(
    () => withLayout(withHistory(withReact(createEditor()))),
    [],
  );

  // 渲染元素的回调函数
  const renderElement = useCallback(props => <Element {...props} />, []);

  // 渲染叶子节点的回调函数
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  // 初始化内容
  const initialValue = useMemo(
    () => [
      {
        type: 'title',
        children: [{ text: '悬浮工具栏示例' }],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '选中下面的文本，您将看到悬浮工具栏出现在选中文本的上方。',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          { text: '试着选中这段文本：' },
          { text: '这是一些可以被格式化的文本', bold: true },
          { text: '。您可以使用悬浮工具栏来应用 ' },
          { text: '粗体', bold: true },
          { text: '、' },
          { text: '斜体', italic: true },
          { text: '、' },
          { text: '下划线', underline: true },
          { text: ' 或 ' },
          { text: '代码格式', code: true },
          { text: '。' },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '悬浮工具栏只在您选中文本时显示，当您点击其他地方或取消选择时会自动隐藏。',
          },
        ],
      },
    ],
    [],
  );

  return (
    <div
      style={{
        maxWidth: '800px',
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

      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={value => {
          console.log('内容更新:', value);
        }}
      >
        {/* 悬浮工具栏 */}
        <HoveringToolbar />

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
            borderRadius: '8px',
            fontSize: '16px',
            lineHeight: '1.5',
            outline: 'none',
            backgroundColor: '#fff',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          }}
        />
      </Slate>

      {/* 使用说明 */}
      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6c757d',
        }}
      >
        <h4 style={{ marginTop: 0, color: '#495057' }}>使用说明：</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li>选中任意文本，悬浮工具栏会自动出现在选中文本的上方</li>
          <li>点击工具栏按钮可以应用相应的格式（粗体、斜体、下划线、代码）</li>
          <li>取消选择或点击其他地方，工具栏会自动隐藏</li>
          <li>工具栏的位置会根据选中文本的位置自动调整</li>
        </ul>
      </div>
    </div>
  );
};

export default HoveringToolbarExample;
