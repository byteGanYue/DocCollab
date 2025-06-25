import React from 'react';

/**
 * 叶子节点渲染组件
 * @param {Object} props - 渲染属性
 * @param {Object} props.attributes - Slate叶子节点属性
 * @param {React.ReactNode} props.children - 子元素
 * @param {Object} props.leaf - Slate叶子节点数据
 */
const Leaf = ({ attributes, children, leaf }) => {
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

  return <span {...attributes}>{children}</span>;
};

export default Leaf;
