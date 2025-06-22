import React from 'react';
import ReactDOM from 'react-dom';

const FloatingToolbar = ({ visible, position, children }) => {
  if (!visible) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        zIndex: 9999,
        background: 'rgba(255,255,255,0.98)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        borderRadius: 8,
        padding: 8,
        transition: 'opacity 0.2s',
        pointerEvents: 'auto',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

export default FloatingToolbar;
