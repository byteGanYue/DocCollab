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
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

export default BlockButton;
