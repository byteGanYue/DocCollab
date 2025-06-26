import React from 'react';
import { useSlate } from 'slate-react';
import Button from './Button';
import Icon from './Icon';
import { toggleMark, isMarkActive } from '../utils/editorHelpers';

/**
 * 获取格式对应的提示文本
 * @param {string} format - 格式类型
 * @returns {string} 提示文本
 */
const getFormatTitle = format => {
  const titles = {
    bold: '粗体 (Ctrl+B)',
    italic: '斜体 (Ctrl+I)',
    underline: '下划线 (Ctrl+U)',
    strikethrough: '删除线',
    code: '行内代码',
  };

  return titles[format] || format;
};

/**
 * 文本标记按钮组件
 * @param {Object} props - 组件属性
 * @param {string} props.format - 格式类型
 * @param {string} props.icon - 图标名称
 */
const MarkButton = ({ format, icon }) => {
  const editor = useSlate();

  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
      title={getFormatTitle(format)}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

export default MarkButton;
