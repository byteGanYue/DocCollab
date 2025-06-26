import React, { useEffect, useRef } from 'react';
import { Editor, Range } from 'slate';
import { useFocused, useSlate } from 'slate-react';
import { createPortal } from 'react-dom';
import Button from './Button';
import Icon from './Icon';
import { toggleMark, isMarkActive } from '../utils/editorHelpers';

/**
 * 调试版本的悬浮工具栏组件
 */
const HoveringToolbarDebug = () => {
  const ref = useRef(null);
  const editor = useSlate();
  const inFocus = useFocused();

  console.log('HoveringToolbarDebug render', {
    inFocus,
    selection: editor.selection,
  });

  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    console.log('HoveringToolbarDebug useEffect', {
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
      console.log('Hiding toolbar - conditions not met');
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      return;
    }

    console.log('Trying to show toolbar...');

    // 延迟一下以确保DOM已经更新
    setTimeout(() => {
      try {
        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) {
          console.log('No DOM selection available');
          return;
        }

        const domRange = domSelection.getRangeAt(0);
        const rect = domRange.getBoundingClientRect();

        console.log('Positioning toolbar', {
          rect,
          offsetHeight: el.offsetHeight,
          offsetWidth: el.offsetWidth,
          scrollY: window.pageYOffset,
          scrollX: window.pageXOffset,
        });

        // 设置工具栏位置和显示状态
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight - 10}px`;
        el.style.left = `${
          rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
        }px`;

        console.log('Toolbar positioned at', {
          top: el.style.top,
          left: el.style.left,
          opacity: el.style.opacity,
          visibility: el.style.visibility,
        });
      } catch (error) {
        console.error('Error positioning toolbar:', error);
      }
    }, 10);
  });

  return createPortal(
    <div
      ref={ref}
      style={{
        padding: '4px',
        position: 'absolute',
        zIndex: 10000,
        top: '-10000px',
        left: '-10000px',
        opacity: '0',
        visibility: 'hidden',
        backgroundColor: '#333',
        borderRadius: '6px',
        transition: 'opacity 0.2s ease',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        pointerEvents: 'auto',
      }}
      onMouseDown={e => {
        console.log('Toolbar mousedown');
        e.preventDefault();
      }}
    >
      <FormatButton format="bold" icon="format_bold" />
      <FormatButton format="italic" icon="format_italic" />
      <FormatButton format="underline" icon="format_underlined" />
      <FormatButton format="code" icon="code" />
    </div>,
    document.body,
  );
};

/**
 * 格式化按钮组件
 */
const FormatButton = ({ format, icon }) => {
  const editor = useSlate();

  return (
    <Button
      reversed
      active={isMarkActive(editor, format)}
      onMouseDown={e => {
        console.log('Format button clicked:', format);
        e.preventDefault();
        toggleMark(editor, format);
      }}
      style={{
        minWidth: '24px',
        height: '24px',
        padding: '4px',
        fontSize: '12px',
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

export default HoveringToolbarDebug;
