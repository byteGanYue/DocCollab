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

  let style = {};
  if (leaf.bold) style.fontWeight = 'bold';
  if (leaf.code) {
    style.fontFamily = 'monospace';
    style.backgroundColor = '#eee';
    style.padding = '2px 4px';
    style.borderRadius = '4px';
  }
  if (leaf.italic) style.fontStyle = 'italic';
  if (leaf.underline) style.textDecoration = 'underline';
  if (leaf.strikethrough)
    style.textDecoration =
      (style.textDecoration ? style.textDecoration + ' ' : '') + 'line-through';
  if (leaf.color) style.color = leaf.color;
  if (leaf.backgroundColor) style.backgroundColor = leaf.backgroundColor;

  // 评论高亮处理
  if (leaf.comment) {
    // 如果 comment 是对象（包含评论信息），使用更明显的高亮样式
    style.backgroundColor = 'rgba(255, 230, 0, 0.4)';
    style.borderBottom = '2px solid #ffc107';
    style.borderRadius = '2px';
    style.padding = '0 1px';
    style.cursor = 'pointer';

    // 添加标题提示，显示评论内容
    if (typeof leaf.comment === 'object') {
      attributes['title'] =
        `${leaf.comment.author || '匿名'}: ${leaf.comment.content || ''}`;
      attributes['data-comment-id'] = leaf.comment.id;
    }
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
        cls !== 'code' &&
        cls !== 'strikethrough' &&
        cls !== 'color' &&
        cls !== 'backgroundColor' &&
        cls !== 'comment',
    );

    if (validTokenClasses.length > 0) {
      return (
        <span
          {...attributes}
          style={style}
          className={validTokenClasses.map(cls => `token ${cls}`).join(' ')}
        >
          {children}
        </span>
      );
    }
  }

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

export default Leaf;
