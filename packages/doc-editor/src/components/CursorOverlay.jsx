import React, { useRef } from 'react';
import { useRemoteCursorOverlayPositions } from '@slate-yjs/react';

/**
 * 光标选区组件
 * 用于显示远程用户的选择区域
 */
const Selection = ({ data, selectionRects, caretPosition }) => {
  if (!data) {
    return null;
  }

  const selectionStyle = {
    backgroundColor: data.color,
  };

  return (
    <>
      {selectionRects.map((position, i) => (
        <div
          style={{
            ...selectionStyle,
            ...position,
            position: 'absolute',
            pointerEvents: 'none',
            opacity: 0.2,
          }}
          className="selection"
          key={i}
        />
      ))}
      {caretPosition && <Caret caretPosition={caretPosition} data={data} />}
    </>
  );
};

/**
 * 光标组件
 * 用于显示远程用户的光标位置和用户信息
 */
const Caret = ({ caretPosition, data }) => {
  const caretStyle = {
    ...caretPosition,
    position: 'absolute',
    width: '2px',
    background: data?.color,
  };

  const labelStyle = {
    transform: 'translateY(-100%)',
    background: data?.color,
    position: 'absolute',
    fontSize: '14px',
    color: '#fff',
    whiteSpace: 'nowrap',
    top: 0,
    borderRadius: '6px',
    borderBottomLeftRadius: 0,
    padding: '2px 6px',
    pointerEvents: 'none',
  };

  return (
    <div style={caretStyle} className="caretMarker">
      <div className="caret" style={labelStyle}>
        {data?.name || '匿名用户'}
      </div>
    </div>
  );
};

/**
 * 光标覆盖层组件
 * 用于显示所有远程用户的光标和选择区域
 */
export function CursorOverlay({ children }) {
  const containerRef = useRef(null);
  const [cursors] = useRemoteCursorOverlayPositions({ containerRef });

  return (
    <div
      className="cursors"
      ref={containerRef}
      style={{ position: 'relative' }}
    >
      {children}
      {cursors.map(cursor => (
        <Selection key={cursor.clientId} {...cursor} />
      ))}
    </div>
  );
}

export default CursorOverlay;
