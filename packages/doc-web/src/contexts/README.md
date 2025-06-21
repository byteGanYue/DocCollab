# 用户状态管理文档

## 概述

本项目使用 React Context 实现全局用户状态管理，提供用户登录、登出和用户信息的统一管理。

## 核心组件

### UserContext

位置：`src/contexts/UserContext.jsx`

提供全局用户状态管理，包括：
- 用户信息存储
- 登录状态管理
- 本地存储同步

### useUser Hook

基础的用户状态管理Hook，提供：
- `userInfo`: 当前用户信息
- `isAuthenticated`: 登录状态
- `login(userData)`: 登录方法
- `logout()`: 登出方法
- `updateUserInfo(newInfo)`: 更新用户信息

### useAuth Hook

位置：`src/hooks/useAuth.jsx`

增强的认证管理Hook，在useUser基础上提供：
- `requireAuth()`: 检查认证状态
- `getUserDisplayName()`: 获取用户显示名称
- `getUserAvatarUrl()`: 获取用户头像URL
- `hasPermission(permission)`: 权限检查

## 使用方法

### 1. 在应用根部配置Provider

```jsx
// main.jsx
import { UserProvider } from '@/contexts/UserContext';

createRoot(document.getElementById('root')).render(
  <UserProvider>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </UserProvider>,
);
```

### 2. 在登录组件中使用

```jsx
// LoginForm.jsx
import { useUser } from '@/contexts/UserContext';

const LoginForm = () => {
  const { login } = useUser();
  
  const handleLogin = async (userData) => {
    // 调用登录API
    const res = await userAPI.login(userData);
    if (res.code === 200) {
      // 保存用户信息到全局状态
      login(res.data);
      navigate('/home');
    }
  };
};
```

### 3. 在布局组件中显示用户信息

```jsx
// Layout.jsx
import { useUser } from '@/contexts/UserContext';

const Layout = () => {
  const { userInfo, logout } = useUser();
  
  return (
    <div>
      <span>{userInfo?.username || '用户'}</span>
      <button onClick={logout}>登出</button>
    </div>
  );
};
```

### 4. 使用增强的认证Hook

```jsx
// 任何需要认证的组件
import { useAuth } from '@/hooks/useAuth';

const ProtectedComponent = () => {
  const { 
    isAuthenticated, 
    getUserDisplayName, 
    requireAuth 
  } = useAuth();
  
  useEffect(() => {
    requireAuth(); // 检查认证状态，未登录则跳转
  }, []);
  
  return (
    <div>
      欢迎，{getUserDisplayName()}
    </div>
  );
};
```

## 用户信息数据结构

```javascript
const userInfo = {
  id: '_id',
  username: '用户名',
  // 其他用户相关字段
};
```

## 本地存储

用户信息会自动同步到 localStorage，key为 `userInfo`，格式为JSON字符串。

## 注意事项

1. **Provider位置**: 确保 UserProvider 在路由提供者外层
2. **类型安全**: 使用可选链操作符 `?.` 访问用户信息
3. **权限检查**: 使用 `hasPermission()` 方法进行权限验证
4. **登出处理**: 登出会清除本地存储和全局状态

## 示例：完整的认证流程

```jsx
// 1. 用户登录
const handleLogin = async (credentials) => {
  const response = await api.login(credentials);
  login(response.data); // 保存到全局状态
};

// 2. 检查认证状态
const { isAuthenticated, userInfo } = useUser();
if (!isAuthenticated) {
  // 跳转到登录页面
}

// 3. 显示用户信息
<div>
  <Avatar src={userInfo?.avatar} />
  <span>{userInfo?.username}</span>
</div>

// 4. 用户登出
const handleLogout = () => {
  logout(); // 清除状态和本地存储
  navigate('/login');
};
``` 