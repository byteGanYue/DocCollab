import React, { useEffect, useRef } from 'react';
import { Editor, Range } from 'slate';
import { useFocused, useSlate } from 'slate-react';
import Button from './Button';
import Icon from './Icon';
import Menu from './Menu';
import Portal from './Portal';
import { toggleMark, isMarkActive } from '../utils/editorHelpers';

/**
 * 悬浮工具栏组件
 * 当用户选中文本时，会在选中区域上方显示格式化工具栏
 */
const HoveringToolbar = () => {
  const ref = useRef(null);
  const editor = useSlate();
  const inFocus = useFocused();

  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    console.log('HoveringToolbar useEffect triggered', {
      hasElement: !!el,
      hasSelection: !!selection,
      inFocus,
      isCollapsed: selection ? Range.isCollapsed(selection) : null,
      selectionString: selection ? Editor.string(editor, selection) : null,
    });

    if (!el) {
      console.log('No element reference');
      return;
    }

    // 如果没有选中内容、编辑器未聚焦、选区已折叠或选中内容为空，则隐藏工具栏
    if (
      !selection ||
      !inFocus ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ''
    ) {
      console.log('Hiding toolbar - no valid selection');
      // 隐藏工具栏
      el.style.opacity = '0';
      el.style.top = '-10000px';
      el.style.left = '-10000px';
      return;
    }

    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      console.log('No DOM selection');
      el.style.opacity = '0';
      el.style.top = '-10000px';
      el.style.left = '-10000px';
      return;
    }

    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();

    console.log('Showing toolbar', {
      rect,
      offsetHeight: el.offsetHeight,
      offsetWidth: el.offsetWidth,
    });

    // 设置工具栏位置和显示状态
    el.style.opacity = '1';
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight - 6}px`;
    el.style.left = `${
      rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
    }px`;
  }, [editor, inFocus, editor.selection]); // 添加依赖数组

  return (
    <Portal>
      <Menu
        ref={ref}
        style={{
          padding: '8px 7px 6px',
          position: 'absolute',
          zIndex: 1000,
          top: '-10000px',
          left: '-10000px',
          marginTop: '-6px',
          opacity: '0',
          backgroundColor: '#222',
          borderRadius: '4px',
          transition: 'opacity 0.75s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseDown={e => {
          // 防止工具栏夺取编辑器焦点
          e.preventDefault();
        }}
      >
        <FormatButton format="bold" icon="format_bold" />
        <FormatButton format="italic" icon="format_italic" />
        <FormatButton format="underline" icon="format_underlined" />
        <FormatButton format="code" icon="code" />
      </Menu>
    </Portal>
  );
};

/**
 * 格式化按钮组件
 * @param {Object} props - 组件属性
 * @param {string} props.format - 格式类型
 * @param {string} props.icon - 图标名称
 */
const FormatButton = ({ format, icon }) => {
  const editor = useSlate();

  return (
    <Button
      reversed
      active={isMarkActive(editor, format)}
      onMouseDown={() => toggleMark(editor, format)}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

export default HoveringToolbar;
