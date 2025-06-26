import React, { forwardRef } from 'react';

/**
 * Menu组件 - 悬浮工具栏的容器
 * @param {Object} props - 组件属性
 * @param {string} props.className - CSS类名
 * @param {Function} props.onMouseDown - 鼠标按下事件处理函数
 * @param {React.ReactNode} props.children - 子组件
 * @param {React.Ref} ref - 组件引用
 */
const Menu = forwardRef(
  ({ className, onMouseDown, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={style}
        onMouseDown={onMouseDown}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Menu.displayName = 'Menu';

export default Menu;
