import React, { createContext, useState, useEffect } from 'react';
import { themes, defaultTheme } from '@/styles/themes';

// 创建主题 Context
const ThemeContext = createContext();

/**
 * ThemeProvider 组件，用于提供主题上下文。
 *
 * @param {Object} props 组件的属性
 * @param {ReactNode} props.children 组件的子元素
 * @returns 返回包含子元素的 ThemeContext.Provider 组件
 */
const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);

  // 应用主题到 CSS 变量
  const applyTheme = themeKey => {
    const theme = themes[themeKey];
    if (!theme) return;

    const root = document.documentElement;
    const colors = theme.colors;

    // 设置 CSS 变量
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // 设置主题类名
    root.className = `theme-${themeKey}`;

    // 保存到 localStorage
    localStorage.setItem('theme', themeKey);
  };

  // 切换主题
  const toggleTheme = themeKey => {
    setCurrentTheme(themeKey);
    applyTheme(themeKey);
  };

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || defaultTheme;
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // 获取当前主题信息
  const getCurrentTheme = () => themes[currentTheme];

  const value = {
    currentTheme,
    toggleTheme,
    getCurrentTheme,
    themes,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
// 导出 ThemeContext，ThemeProvider
export { ThemeContext, ThemeProvider };
