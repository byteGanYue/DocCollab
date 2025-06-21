import { UserContext } from '@/contexts/UserContext';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// 自定义 hook 用于使用用户上下文
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser 必须在 UserProvider 内部使用');
  }
  return context;
};
/**
 * 认证相关的自定义Hook
 * 提供用户认证状态管理和相关操作
 *
 * @returns {Object} 认证状态和相关方法
 */
export const useAuth = () => {
  const { userInfo, isAuthenticated, login, logout } = useUser();
  const navigate = useNavigate();

  // 检查用户是否已登录，如果未登录则跳转到登录页
  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  // 登出并跳转到登录页
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!userInfo) return '未知用户';
    return userInfo.username || '用户';
  };
  // 获取用户Id
  const getUserId = () => {
    if (!userInfo) return '';
    return userInfo.userId;
  };

  return {
    // 用户信息
    userInfo,
    isAuthenticated,

    // 操作方法
    login,
    logout: handleLogout,
    requireAuth,

    // 便捷方法
    getUserDisplayName,
    getUserId,
  };
};
