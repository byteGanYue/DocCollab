import React, { createContext, useState, useEffect } from 'react';

// 创建用户 Context
const UserContext = createContext();

/**
 * UserProvider 组件，用于提供用户信息上下文
 *
 * @param {Object} props 组件的属性
 * @param {ReactNode} props.children 组件的子元素
 * @returns 返回包含子元素的 UserContext.Provider 组件
 */
const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化用户信息，从 localStorage 中获取
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      try {
        // 如果 savedUserInfo 是对象，直接使用；如果是字符串，尝试解析 JSON
        let parsedUserInfo;
        if (typeof savedUserInfo === 'string') {
          parsedUserInfo = JSON.parse(savedUserInfo);
        } else {
          parsedUserInfo = savedUserInfo;
        }

        setUserInfo(parsedUserInfo);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        // 如果解析失败，清除无效数据
        localStorage.removeItem('userInfo');
      }
    }
  }, []);

  // 登录：设置用户信息
  const login = userData => {
    setUserInfo(userData);
    setIsAuthenticated(true);
    // 保存到 localStorage
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  // 登出：清除用户信息
  const logout = () => {
    setUserInfo(null);
    setIsAuthenticated(false);
    // 清除 localStorage
    localStorage.removeItem('userInfo');
  };

  // 更新用户信息
  const updateUserInfo = newUserInfo => {
    const updatedInfo = { ...userInfo, ...newUserInfo };
    setUserInfo(updatedInfo);
    localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
  };

  const value = {
    userInfo,
    isAuthenticated,
    login,
    logout,
    updateUserInfo,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 导出 UserContext, UserProvider 和 useUser hook
export { UserContext, UserProvider };
