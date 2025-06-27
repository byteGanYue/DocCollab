import React, { useState, useCallback } from 'react';
import { Editor } from 'slate';
import { useSlate } from 'slate-react';
import Button from './Button';
import Icon from './Icon';

/**
 * 颜色选择按钮组件
 * @param {Object} props - 组件属性
 * @param {string} props.icon - 图标名称
 * @param {string} props.type - 颜色类型 ('color' | 'backgroundColor')
 */
const ColorButton = ({ icon, type = 'color' }) => {
  const editor = useSlate();
  const [showColorPicker, setShowColorPicker] = useState(false);

  // 颜色选项
  const colors =
    type === 'color'
      ? ['#F44336', '#2196F3', '#4CAF50', '#FFEB3B', '#9C27B0', '#000000']
      : ['#FFEB3B', '#FFF176', '#81D4FA', '#A5D6A7', '#FFCC80', '#E1BEE7'];

  // 标题文本
  const title = type === 'color' ? '文本颜色' : '文本高亮';

  /**
   * 检查当前选区是否有特定的颜色标记
   * @returns {string|null} 当前颜色标记值或null
   */
  const getCurrentColor = () => {
    const marks = Editor.marks(editor);
    return marks ? marks[type] : null;
  };

  // 处理颜色选择
  const handleColorSelect = useCallback(
    color => {
      const currentColor = getCurrentColor();

      // 如果点击了当前已有的颜色，则移除该颜色标记
      if (currentColor === color) {
        Editor.removeMark(editor, type);
      } else {
        // 否则应用新颜色
        Editor.addMark(editor, type, color);
      }

      setShowColorPicker(false);
    },
    [editor, type],
  );

  // 清除颜色标记
  const clearColor = useCallback(() => {
    Editor.removeMark(editor, type);
    setShowColorPicker(false);
  }, [editor, type]);

  // 获取当前颜色
  const currentColor = getCurrentColor();

  return (
    <div style={{ position: 'relative' }}>
      <Button
        active={!!currentColor}
        onMouseDown={e => {
          e.preventDefault();
          setShowColorPicker(!showColorPicker);
        }}
        title={title}
      >
        <Icon>{icon}</Icon>
      </Button>

      {showColorPicker && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '0',
            backgroundColor: '#fff',
            padding: '8px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            width: '150px',
          }}
        >
          <div
            style={{
              borderBottom: '1px solid #eee',
              paddingBottom: '5px',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {title}
            {currentColor && (
              <button
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#d32f2f',
                  padding: '0',
                }}
                onMouseDown={e => {
                  e.preventDefault();
                  clearColor();
                }}
                title="清除颜色"
              >
                清除
              </button>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {colors.map(color => (
              <div
                key={color}
                style={{
                  width: '100%',
                  height: '24px',
                  backgroundColor: color,
                  borderRadius: '2px',
                  cursor: 'pointer',
                  border: '1px solid #ddd',
                  boxShadow:
                    currentColor === color ? '0 0 0 2px #1890ff' : 'none',
                }}
                onMouseDown={e => {
                  e.preventDefault();
                  handleColorSelect(color);
                }}
                title={`应用${color}颜色`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorButton;
