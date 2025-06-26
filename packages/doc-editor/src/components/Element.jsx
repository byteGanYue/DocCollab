import React from 'react';
import { isAlignElement } from '../utils/editorHelpers';

/**
 * 元素渲染组件
 * @param {Object} props - 渲染属性
 * @param {Object} props.attributes - Slate元素属性
 * @param {React.ReactNode} props.children - 子元素
 * @param {Object} props.element - Slate元素数据
 */
const Element = ({ attributes, children, element }) => {
  const style = {};

  // 如果元素有对齐属性，应用文本对齐样式
  if (isAlignElement(element)) {
    style.textAlign = element.align;
  }

  switch (element.type) {
    case 'title':
      return (
        <h1
          style={{
            ...style,
            fontSize: '2.5em',
            fontWeight: 'bold',
            margin: '0 0 16px 0',
            lineHeight: 1.2,
            color: '#1f2937',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '8px',
          }}
          {...attributes}
        >
          {children}
        </h1>
      );
    case 'block-quote':
      return (
        <blockquote
          style={{
            ...style,
            borderLeft: '4px solid #ddd',
            margin: '16px 0',
            paddingLeft: '16px',
            color: '#666',
            fontStyle: 'italic',
          }}
          {...attributes}
        >
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul
          style={{
            ...style,
            margin: '8px 0',
            paddingLeft: '20px',
          }}
          {...attributes}
        >
          {children}
        </ul>
      );
    case 'heading-one':
      return (
        <h1
          style={{
            ...style,
            fontSize: '2em',
            fontWeight: 'bold',
            margin: '16px 0 8px 0',
            lineHeight: 1.2,
          }}
          {...attributes}
        >
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2
          style={{
            ...style,
            fontSize: '1.5em',
            fontWeight: 'bold',
            margin: '14px 0 6px 0',
            lineHeight: 1.3,
          }}
          {...attributes}
        >
          {children}
        </h2>
      );
    case 'list-item':
      return (
        <li
          style={{
            ...style,
            margin: '2px 0',
            lineHeight: 1.6,
          }}
          {...attributes}
        >
          {children}
        </li>
      );
    case 'numbered-list':
      return (
        <ol
          style={{
            ...style,
            margin: '8px 0',
            paddingLeft: '20px',
          }}
          {...attributes}
        >
          {children}
        </ol>
      );
    default:
      return (
        <p
          style={{
            ...style,
            margin: '4px 0',
            lineHeight: 1.6,
          }}
          {...attributes}
        >
          {children}
        </p>
      );
  }
};

export default Element;
