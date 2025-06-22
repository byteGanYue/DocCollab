import React, { createContext, useState, useEffect, useCallback } from 'react';
import { userAPI } from '../utils/api';

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
  const [userPermission, setUserPermission] = useState('private'); // 用户权限状态：'public' 或 'private'

  // 获取用户完整信息包括权限状态
  const fetchUserInfo = useCallback(async userId => {
    try {
      const response = await userAPI.getUserInfo(userId);

      if (response.success) {
        const userFullInfo = response.data;
        // 根据后端返回的isPublic字段设置权限状态
        const permission = userFullInfo.isPublic ? 'public' : 'private';
        setUserPermission(permission);

        // 更新用户信息状态和localStorage
        setUserInfo(userFullInfo);
        localStorage.setItem('userInfo', JSON.stringify(userFullInfo));

        // 保存权限状态到localStorage
        localStorage.setItem('userPermission', permission);

        return userFullInfo;
      } else {
        console.warn('⚠️ API 响应 success 不为 true:', response);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
    return null;
  }, []);

  // 初始化用户信息，从 localStorage 中获取
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    const savedPermission = localStorage.getItem('userPermission');

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

        // 恢复权限状态
        if (savedPermission) {
          setUserPermission(savedPermission);
        } else {
          // 如果没有保存的权限状态，从后端获取
          const userId = parsedUserInfo?.userId || parsedUserInfo?._id;
          if (userId) {
            fetchUserInfo(userId).catch(error => {
              console.error('初始化时获取用户权限失败:', error);
            });
          } else {
            console.warn('⚠️ 无法获取userId，跳过权限获取');
          }
        }
      } catch (error) {
        console.error('解析用户信息失败:', error);
        // 如果解析失败，清除无效数据
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userPermission');
      }
    }
  }, [fetchUserInfo]);

  // 登录：设置用户信息
  const login = async userData => {
    // 先清除旧的用户信息，确保完全替换
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userPermission');

    // 设置新的用户信息
    setUserInfo(userData);
    setIsAuthenticated(true);
    // 保存到 localStorage
    localStorage.setItem('userInfo', JSON.stringify(userData));

    // 获取用户权限状态
    const userId = userData?.userId || userData?._id;
    if (userId) {
      await fetchUserInfo(userId);
    } else {
      console.warn('⚠️ 无法获取userId，跳过权限获取');
    }
  };

  // 登出：清除用户信息
  const logout = () => {
    setUserInfo(null);
    setIsAuthenticated(false);
    setUserPermission('private');
    // 清除 localStorage
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userPermission');
  };

  // 更新用户信息 - 完全替换而不是合并
  const updateUserInfo = newUserInfo => {
    // 完全替换用户信息，而不是合并
    setUserInfo(newUserInfo);
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
  };

  // 更新用户权限状态
  const updateUserPermission = newPermission => {
    setUserPermission(newPermission);
    localStorage.setItem('userPermission', newPermission);
  };

  const value = {
    userInfo,
    isAuthenticated,
    userPermission,
    login,
    logout,
    updateUserInfo,
    updateUserPermission,
    fetchUserInfo,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 导出 UserContext, UserProvider 和 useUser hook
export { UserContext, UserProvider };
