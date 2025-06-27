import React from 'react';
import { Element, Transforms, Node } from 'slate';
import { useSlateStatic } from 'slate-react';
import Button from './Button';
import Icon from './Icon';

/**
 * 代码块按钮组件
 * 用于在编辑器中插入代码块，支持语法高亮
 * 支持二次点击取消代码块样式
 * @returns {JSX.Element} 代码块按钮组件
 */
const CodeBlockButton = () => {
  const editor = useSlateStatic();

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

  /**
   * 处理代码块按钮点击事件
   * 将选中的段落转换为代码块结构
   * 如果已经是代码块，则转换回普通段落
   */
  const handleClick = () => {
    if (isCodeBlockActive()) {
      // 已经是代码块，转换回普通段落

      // 找到所有代码行
      const nodes = Array.from(
        editor.nodes({
          match: n => Element.isElement(n) && n.type === 'code-line',
        }),
      );

      // 将每个代码行转换为普通段落
      nodes.forEach(([node, path]) => {
        // 获取代码行的文本内容
        const textContent = Node.string(node);

        // 在同一位置创建新的段落
        Transforms.setNodes(editor, { type: 'paragraph' }, { at: path });
      });

      // 从代码块中解包出节点
      Transforms.unwrapNodes(editor, {
        match: n => Element.isElement(n) && n.type === 'code-block',
        split: true,
      });
    } else {
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
    }
  };

  return (
    <Button
      active={isCodeBlockActive()}
      onMouseDown={event => {
        event.preventDefault();
        handleClick();
      }}
      title="插入/取消代码块"
    >
      <Icon>data_object</Icon>
    </Button>
  );
};

export default CodeBlockButton;
