import React, { createContext, useState, useEffect } from 'react';
import { ConfigProvider } from 'antd';
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

  // 获取 Ant Design 主题配置
  const getAntdThemeConfig = () => {
    const theme = themes[currentTheme];
    if (!theme) return {};

    return {
      token: {
        colorPrimary: theme.colors.primary,
        colorSuccess: theme.colors.success,
        colorWarning: theme.colors.warning,
        colorError: theme.colors.error,
        colorInfo: theme.colors.info,
        colorBgBase: theme.colors.bgContainer,
        colorBgContainer: theme.colors.bgContainer,
        colorBgLayout: theme.colors.bgLayout,
        colorTextBase: theme.colors.text,
        colorText: theme.colors.text,
        colorTextSecondary: theme.colors.textSecondary,
        colorBorder: theme.colors.border,
        borderRadius: 6,
        fontSize: 14,
      },
      components: {
        Button: {
          colorPrimary: theme.colors.primary,
          colorPrimaryHover: theme.colors.hover,
          algorithm: true, // 启用算法
        },
        Table: {
          colorPrimary: theme.colors.primary,
          headerBg: theme.colors.hover, // 使用主题色的深色作为表头背景
          headerColor: '#ffffff', // 表头文字使用白色
          headerSortActiveBg: theme.colors.primary, // 排序激活状态背景色
          headerSortHoverBg: theme.colors.primary, // 排序悬停状态背景色
          borderColor: theme.colors.border,
          rowHoverBg: theme.colors.background,
          algorithm: true,
        },
        Dropdown: {
          colorPrimary: theme.colors.primary,
          colorBgElevated: theme.colors.bgContainer,
          algorithm: true,
        },
        Input: {
          colorPrimary: theme.colors.primary,
          colorBorder: theme.colors.border,
          algorithm: true,
        },
        Select: {
          colorPrimary: theme.colors.primary,
          colorBorder: theme.colors.border,
          algorithm: true,
        },
        Menu: {
          colorPrimary: theme.colors.primary,
          colorBgContainer: theme.colors.bgContainer,
          algorithm: true,
        },
        Modal: {
          colorPrimary: theme.colors.primary,
          colorBgMask: 'rgba(0, 0, 0, 0.45)',
          algorithm: true,
        },
        Tag: {
          colorPrimary: theme.colors.primary,
          algorithm: true,
        },
        Pagination: {
          colorPrimary: theme.colors.primary,
          algorithm: true,
        },
        Typography: {
          colorText: theme.colors.text,
          colorTextSecondary: theme.colors.textSecondary,
        },
        Layout: {
          colorBgHeader: theme.colors.bgContainer,
          colorBgBody: theme.colors.bgLayout,
          colorBgTrigger: theme.colors.background,
        },
      },
    };
  };

  const value = {
    currentTheme,
    toggleTheme,
    getCurrentTheme,
    getAntdThemeConfig,
    themes,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={getAntdThemeConfig()}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};
// 导出 ThemeContext，ThemeProvider
export { ThemeContext, ThemeProvider };
