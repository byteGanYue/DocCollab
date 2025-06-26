import React from 'react';

/**
 * 叶子节点渲染组件
 * @param {Object} props - 渲染属性
 * @param {Object} props.attributes - Slate叶子节点属性
 * @param {React.ReactNode} props.children - 子元素
 * @param {Object} props.leaf - Slate叶子节点数据
 */
const Leaf = ({ attributes, children, leaf }) => {
  const { text, ...rest } = leaf;

  // 应用粗体样式
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  // 应用代码样式
  if (leaf.code) {
    children = (
      <code
        style={{
          backgroundColor: '#f4f4f4',
          border: '1px solid #e1e1e1',
          borderRadius: '3px',
          padding: '2px 4px',
          fontSize: '0.9em',
          fontFamily:
            'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
        }}
      >
        {children}
      </code>
    );
  }

  // 应用斜体样式
  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  // 应用下划线样式
  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  // 处理语法高亮token
  // 获取除了text之外的所有属性作为CSS类名
  const tokenClasses = Object.keys(rest);

  // 如果有token类，应用token样式
  if (tokenClasses.length > 0) {
    // 过滤掉非token属性
    const validTokenClasses = tokenClasses.filter(
      cls =>
        cls !== 'bold' &&
        cls !== 'italic' &&
        cls !== 'underline' &&
        cls !== 'code',
    );

    if (validTokenClasses.length > 0) {
      return (
        <span
          {...attributes}
          className={validTokenClasses.map(cls => `token ${cls}`).join(' ')}
        >
          {children}
        </span>
      );
    }
  }

  return <span {...attributes}>{children}</span>;
};

export default Leaf;
