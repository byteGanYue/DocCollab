import React from 'react';
import { useSlate } from 'slate-react';
import Button from './Button';
import Icon from './Icon';
import {
  toggleBlock,
  isBlockActive,
  isAlignType,
} from '../utils/editorHelpers';

/**
 * 获取块级格式对应的提示文本
 * @param {string} format - 格式类型
 * @returns {string} 提示文本
 */
const getBlockTitle = format => {
  const titles = {
    'heading-one': '一级标题',
    'heading-two': '二级标题',
    'block-quote': '引用块',
    'numbered-list': '有序列表',
    'bulleted-list': '无序列表',
    left: '左对齐',
    center: '居中对齐',
    right: '右对齐',
    justify: '两端对齐',
  };

  return titles[format] || format;
};

/**
 * 块级元素按钮组件
 * @param {Object} props - 组件属性
 * @param {string} props.format - 格式类型
 * @param {string} props.icon - 图标名称
 */
const BlockButton = ({ format, icon }) => {
  const editor = useSlate();

  return (
    <Button
      active={isBlockActive(
        editor,
        format,
        isAlignType(format) ? 'align' : 'type',
      )}
      onMouseDown={event => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
      title={getBlockTitle(format)}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

export default BlockButton;
