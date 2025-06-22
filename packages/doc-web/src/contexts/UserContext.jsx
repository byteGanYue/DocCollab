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
    console.log('🔥 fetchUserInfo 被调用，userId:', userId);
    try {
      console.log('🚀 开始调用 getUserInfo API');
      const response = await userAPI.getUserInfo(userId);
      console.log('📥 API 响应:', response);

      if (response.success) {
        const userFullInfo = response.data;
        // 根据后端返回的isPublic字段设置权限状态
        console.log('哈哈哈哈哈哈哈userFullInfo:', userFullInfo);
        const permission = userFullInfo.isPublic ? 'public' : 'private';
        setUserPermission(permission);

        // 保存权限状态到localStorage
        localStorage.setItem('userPermission', permission);

        console.log('用户权限状态:', permission);
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
    console.log('🚀 UserContext useEffect 执行');
    const savedUserInfo = localStorage.getItem('userInfo');
    const savedPermission = localStorage.getItem('userPermission');
    console.log('💾 savedUserInfo:', savedUserInfo);
    console.log('💾 savedPermission:', savedPermission);

    if (savedUserInfo) {
      try {
        // 如果 savedUserInfo 是对象，直接使用；如果是字符串，尝试解析 JSON
        let parsedUserInfo;
        if (typeof savedUserInfo === 'string') {
          parsedUserInfo = JSON.parse(savedUserInfo);
        } else {
          parsedUserInfo = savedUserInfo;
        }

        console.log('📄 解析后的用户信息:', parsedUserInfo);
        setUserInfo(parsedUserInfo);
        setIsAuthenticated(true);

        // 恢复权限状态
        if (savedPermission) {
          console.log('✅ 使用保存的权限状态:', savedPermission);
          setUserPermission(savedPermission);
        } else {
          console.log('⚠️ 没有保存的权限状态，需要从后端获取');
          // 如果没有保存的权限状态，从后端获取
          const userId = parsedUserInfo?.userId || parsedUserInfo?._id;
          console.log('🆔 准备获取权限的userId:', userId);
          if (userId) {
            console.log('✅ 调用 fetchUserInfo 获取权限');
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
    } else {
      console.log('ℹ️ 没有保存的用户信息');
    }
  }, [fetchUserInfo]);

  // 登录：设置用户信息
  const login = async userData => {
    console.log('🔑 用户登录，userData:', userData);
    setUserInfo(userData);
    setIsAuthenticated(true);
    // 保存到 localStorage
    localStorage.setItem('userInfo', JSON.stringify(userData));

    // 获取用户权限状态
    const userId = userData?.userId || userData?._id;
    console.log('🆔 提取的userId:', userId);
    if (userId) {
      console.log('✅ 准备调用 fetchUserInfo');
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

  // 更新用户信息
  const updateUserInfo = newUserInfo => {
    const updatedInfo = { ...userInfo, ...newUserInfo };
    setUserInfo(updatedInfo);
    localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
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
