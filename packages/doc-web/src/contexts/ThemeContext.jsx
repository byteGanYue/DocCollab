import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, defaultTheme } from '@/styles/themes';

// 创建主题 Context
const ThemeContext = createContext();

// 主题 Provider 组件
export const ThemeProvider = ({ children }) => {
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

// 自定义 Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
