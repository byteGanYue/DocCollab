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

  // 处理颜色选择
  const handleColorSelect = useCallback(
    color => {
      Editor.addMark(editor, type, color);
      setShowColorPicker(false);
    },
    [editor, type],
  );

  return (
    <div style={{ position: 'relative' }}>
      <Button
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
            }}
          >
            {title}
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
