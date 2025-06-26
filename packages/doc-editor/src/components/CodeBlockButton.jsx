import React from 'react';
import { Element, Transforms } from 'slate';
import { useSlateStatic } from 'slate-react';
import Button from './Button';
import Icon from './Icon';

/**
 * 代码块按钮组件
 * 用于在编辑器中插入代码块，支持语法高亮
 * @returns {JSX.Element} 代码块按钮组件
 */
const CodeBlockButton = () => {
  const editor = useSlateStatic();

  /**
   * 处理代码块按钮点击事件
   * 将选中的段落转换为代码块结构
   */
  const handleClick = () => {
    // 将段落包装成代码块
    Transforms.wrapNodes(
      editor,
      {
        type: 'code-block',
        language: 'html',
        children: [],
      },
      {
        match: n => Element.isElement(n) && n.type === 'paragraph',
        split: true,
      },
    );

    // 将段落转换为代码行
    Transforms.setNodes(
      editor,
      { type: 'code-line' },
      {
        match: n => Element.isElement(n) && n.type === 'paragraph',
      },
    );
  };

  /**
   * 检查当前选区是否在代码块中
   * @returns {boolean} 是否在代码块中
   */
  const isCodeBlockActive = () => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      editor.nodes({
        at: selection,
        match: n => Element.isElement(n) && n.type === 'code-block',
      }),
    );

    return !!match;
  };

  return (
    <Button
      active={isCodeBlockActive()}
      onMouseDown={event => {
        event.preventDefault();
        handleClick();
      }}
      title="插入代码块"
    >
      <Icon>data_object</Icon>
    </Button>
  );
};

export default CodeBlockButton;
