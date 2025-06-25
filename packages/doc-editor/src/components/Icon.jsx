import React from 'react';

/**
 * 图标组件 - 使用Material Icons字体
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 图标名称
 */
const Icon = ({ children }) => {
  return (
    <span
      className="material-icons"
      style={{
        fontSize: '18px',
        lineHeight: 1,
        fontFamily: 'Material Icons',
        fontWeight: 'normal',
        fontStyle: 'normal',
        display: 'inline-block',
        textTransform: 'none',
        letterSpacing: 'normal',
        wordWrap: 'normal',
        whiteSpace: 'nowrap',
        direction: 'ltr',
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'optimizeLegibility',
        MozOsxFontSmoothing: 'grayscale',
        fontFeatureSettings: 'liga',
      }}
    >
      {children}
    </span>
  );
};

export default Icon;
