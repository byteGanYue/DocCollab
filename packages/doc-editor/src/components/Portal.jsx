import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal组件 - 将子组件渲染到document.body中
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
const Portal = ({ children }) => {
  return createPortal(children, document.body);
};

export default Portal;
