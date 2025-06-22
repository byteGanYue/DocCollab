import React from 'react';
import ReactDOM from 'react-dom';
import {
  PlusOutlined,
  FontSizeOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

const BlockToolbar = ({
  visible,
  top,
  left,
  onInsert,
  onFormat,
  expanded = false,
  onExpand,
}) => {
  if (!visible) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9999,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: 6,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        pointerEvents: 'auto',
        gap: 8,
        transition: 'box-shadow 0.2s',
      }}
      onMouseDown={e => e.preventDefault()}
    >
      <button
        onClick={onExpand}
        style={{ ...btnStyle, background: expanded ? '#f0f0f0' : 'none' }}
        title="插入新段落"
      >
        <PlusOutlined />
      </button>
      {expanded && (
        <>
          <button
            onClick={() => onFormat('header', 1)}
            style={btnStyle}
            title="一级标题"
          >
            <FontSizeOutlined />1
          </button>
          <button
            onClick={() => onFormat('header', 2)}
            style={btnStyle}
            title="二级标题"
          >
            <FontSizeOutlined />2
          </button>
          <button
            onClick={() => onFormat('list', 'ordered')}
            style={btnStyle}
            title="有序列表"
          >
            <OrderedListOutlined />
          </button>
          <button
            onClick={() => onFormat('list', 'bullet')}
            style={btnStyle}
            title="无序列表"
          >
            <UnorderedListOutlined />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
};

const btnStyle = {
  width: 32,
  height: 32,
  border: 'none',
  background: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  transition: 'background 0.2s',
};

export default BlockToolbar;
