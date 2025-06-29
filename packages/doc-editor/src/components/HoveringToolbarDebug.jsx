import React, { useEffect, useRef, useState } from 'react';
import { Editor, Range } from 'slate';
import { useFocused, useSlate } from 'slate-react';
import { createPortal } from 'react-dom';
import Button from './Button';
import Icon from './Icon';
import {
  toggleMark,
  isMarkActive,
  toggleBlock,
  isBlockActive,
} from '../utils/editorHelpers';

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
    left: '左对齐',
    center: '居中对齐',
    right: '右对齐',
  };

  return titles[format] || format;
};

/**
 * 调试版本的悬浮工具栏组件
 */
const HoveringToolbarDebug = ({ onAddComment }) => {
  const ref = useRef(null);
  const editor = useSlate();
  const inFocus = useFocused();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

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

  // 分隔符组件
  const Divider = () => (
    <div
      style={{
        width: '1px',
        height: '24px',
        backgroundColor: '#555',
        margin: '0 4px',
      }}
    />
  );

  // 颜色选择器
  const ColorPicker = () => {
    const colors = [
      '#F44336',
      '#2196F3',
      '#4CAF50',
      '#FFEB3B',
      '#9C27B0',
      '#000000',
    ];

    return (
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '0',
          backgroundColor: '#333',
          padding: '8px',
          borderRadius: '4px',
          display: 'flex',
          flexWrap: 'wrap',
          width: '120px',
          gap: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10001,
        }}
      >
        {colors.map(color => (
          <div
            key={color}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: color,
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            onMouseDown={e => {
              e.preventDefault();
              Editor.addMark(editor, 'color', color);
              setShowColorPicker(false);
            }}
            title={`应用${color}颜色`}
          />
        ))}
      </div>
    );
  };

  // 高亮颜色选择器
  const HighlightPicker = () => {
    const highlights = [
      '#FFEB3B',
      '#FFF176',
      '#81D4FA',
      '#A5D6A7',
      '#FFCC80',
      '#E1BEE7',
    ];

    return (
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '30px',
          backgroundColor: '#333',
          padding: '8px',
          borderRadius: '4px',
          display: 'flex',
          flexWrap: 'wrap',
          width: '120px',
          gap: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10001,
        }}
      >
        {highlights.map(color => (
          <div
            key={color}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: color,
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            onMouseDown={e => {
              e.preventDefault();
              Editor.addMark(editor, 'backgroundColor', color);
              setShowHighlightPicker(false);
            }}
            title={`应用${color}高亮`}
          />
        ))}
      </div>
    );
  };

  // 评论按钮处理函数
  const handleAddComment = e => {
    e.preventDefault();
    if (onAddComment) {
      onAddComment();
    }
  };

  return createPortal(
    <div
      ref={ref}
      style={{
        padding: '8px 7px 6px',
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
        gap: '4px',
        pointerEvents: 'auto',
      }}
      onMouseDown={e => {
        console.log('Toolbar mousedown');
        e.preventDefault();
      }}
    >
      {/* 文本样式 */}
      <FormatButton format="bold" icon="format_bold" />
      <FormatButton format="italic" icon="format_italic" />
      <FormatButton format="underline" icon="format_underlined" />
      <FormatButton format="strikethrough" icon="strikethrough_s" />
      <FormatButton format="code" icon="code" />

      <Divider />

      {/* 文本颜色 */}
      <div style={{ position: 'relative' }}>
        <Button
          reversed
          onMouseDown={e => {
            e.preventDefault();
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
          }}
          style={{
            minWidth: '24px',
            height: '24px',
            padding: '4px',
            fontSize: '12px',
          }}
          title="文本颜色"
        >
          <Icon>format_color_text</Icon>
        </Button>
        {showColorPicker && <ColorPicker />}
      </div>

      {/* 文本高亮 */}
      <div style={{ position: 'relative' }}>
        <Button
          reversed
          onMouseDown={e => {
            e.preventDefault();
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
          }}
          style={{
            minWidth: '24px',
            height: '24px',
            padding: '4px',
            fontSize: '12px',
          }}
          title="文本高亮"
        >
          <Icon>highlight</Icon>
        </Button>
        {showHighlightPicker && <HighlightPicker />}
      </div>

      <Divider />

      {/* 文本对齐 */}
      <BlockFormatButton format="left" icon="format_align_left" />
      <BlockFormatButton format="center" icon="format_align_center" />
      <BlockFormatButton format="right" icon="format_align_right" />

      <Divider />

      {/* 评论按钮 */}
      <Button
        reversed
        onMouseDown={handleAddComment}
        title="添加评论 (Ctrl+Shift+C)"
      >
        <Icon>mode_comment</Icon>
      </Button>
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
      title={getFormatTitle(format)}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

/**
 * 块级格式按钮组件
 */
const BlockFormatButton = ({ format, icon }) => {
  const editor = useSlate();

  return (
    <Button
      reversed
      active={isBlockActive(editor, format, 'align')}
      onMouseDown={e => {
        console.log('Block format button clicked:', format);
        e.preventDefault();
        toggleBlock(editor, format);
      }}
      style={{
        minWidth: '24px',
        height: '24px',
        padding: '4px',
        fontSize: '12px',
      }}
      title={getFormatTitle(format)}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

export default HoveringToolbarDebug;
