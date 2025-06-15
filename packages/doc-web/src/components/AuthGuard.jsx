import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 路由守卫组件
 * 检查用户登录状态，未登录则跳转到登录页，已登录则跳转到主页
 */
const AuthGuard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 检查本地存储中的token
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('user');

    if (!token || !userInfo) {
      // 没有token或用户信息，跳转到登录页
      navigate('/login', { replace: true });
    } else {
      try {
        // 验证用户信息是否有效
        JSON.parse(userInfo);
        // 有效的登录状态，跳转到主页
        navigate('/home', { replace: true });
      } catch {
        // 用户信息解析失败，清除无效数据并跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    }
  }, [navigate]);

  // 显示加载状态
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666',
      }}
    >
      正在检查登录状态...
    </div>
  );
};

export default AuthGuard;
