# 请求工具使用说明

## 概述

这是一个基于 Axios 封装的 HTTP 请求工具，提供了完整的请求方法、错误处理、Token 管理等功能。

## 主要功能

### 1. 请求方法
- `GET` - 获取数据
- `POST` - 创建数据
- `PUT` - 更新数据（完整更新）
- `PATCH` - 更新数据（部分更新）
- `DELETE` - 删除数据
- `UPLOAD` - 文件上传
- `DOWNLOAD` - 文件下载

### 2. 自动 Token 管理
- 自动从 localStorage 获取 token
- 自动添加到请求头
- 401 错误自动跳转登录页

### 3. 错误处理
- 统一的错误处理机制
- 自动显示错误消息
- 开发环境请求日志

### 4. 文件操作
- 支持文件上传
- 支持文件下载
- 自动处理 FormData

## 使用方法

### 1. 基础请求方法

```javascript
import { get, post, put, patch, del } from '@/utils/request';

// GET 请求
const getData = async () => {
  try {
    const response = await get('/api/users', { page: 1, limit: 10 });
    return response;
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

// POST 请求
const createData = async (data) => {
  try {
    const response = await post('/api/users', data);
    return response;
  } catch (error) {
    console.error('创建数据失败:', error);
  }
};

// PUT 请求
const updateData = async (id, data) => {
  try {
    const response = await put(`/api/users/${id}`, data);
    return response;
  } catch (error) {
    console.error('更新数据失败:', error);
  }
};

// PATCH 请求
const partialUpdate = async (id, data) => {
  try {
    const response = await patch(`/api/users/${id}`, data);
    return response;
  } catch (error) {
    console.error('部分更新失败:', error);
  }
};

// DELETE 请求
const deleteData = async (id) => {
  try {
    const response = await del(`/api/users/${id}`);
    return response;
  } catch (error) {
    console.error('删除数据失败:', error);
  }
};
```

### 2. 文件操作

```javascript
import { upload, download } from '@/utils/request';

// 文件上传
const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await upload('/api/upload', formData);
    return response;
  } catch (error) {
    console.error('文件上传失败:', error);
  }
};

// 文件下载
const downloadFile = async (fileId, filename) => {
  try {
    await download(`/api/files/${fileId}`, {}, filename);
  } catch (error) {
    console.error('文件下载失败:', error);
  }
};
```

### 3. Token 管理

```javascript
import { setToken, getToken, clearToken, isAuthenticated } from '@/utils/request';

// 设置 token
setToken('your-jwt-token');

// 获取 token
const token = getToken();

// 清除 token
clearToken();

// 检查是否已认证
const isAuth = isAuthenticated();
```

### 4. 使用预定义的 API

```javascript
import { userAPI, documentAPI, folderAPI } from '@/utils/api';

// 用户登录
const login = async (email, password) => {
  try {
    const response = await userAPI.login({ email, password });
    return response;
  } catch (error) {
    console.error('登录失败:', error);
  }
};

// 获取文档列表
const getDocuments = async () => {
  try {
    const documents = await documentAPI.getDocuments({ page: 1, limit: 10 });
    return documents;
  } catch (error) {
    console.error('获取文档失败:', error);
  }
};

// 创建文件夹
const createFolder = async (name, parentId) => {
  try {
    const folder = await folderAPI.createFolder({ name, parentId });
    return folder;
  } catch (error) {
    console.error('创建文件夹失败:', error);
  }
};
```

## 配置说明

### 1. 基础配置

```javascript
// 在 request.jsx 中配置
const instance = axios.create({
  baseURL: 'http://localhost:3000/api', // API 基础地址
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json', // 默认请求头
  },
});
```

### 2. 请求拦截器

- 自动添加 Authorization 头
- 开发环境请求日志
- 错误处理

### 3. 响应拦截器

- 统一响应数据处理
- 错误状态码处理
- 自动跳转登录页（401 错误）

## 错误处理

### 1. HTTP 状态码处理

- `401` - 未授权，自动清除 token 并跳转登录页
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误

### 2. 网络错误处理

- 网络连接失败
- 请求超时
- 其他网络错误

### 3. 自定义错误处理

```javascript
try {
  const response = await get('/api/data');
  // 处理成功响应
} catch (error) {
  // 错误已经被统一处理，这里可以添加额外的处理逻辑
  console.error('自定义错误处理:', error);
}
```

## 开发环境特性

### 1. 请求日志

在开发环境下，会自动打印请求和响应信息：

```
🚀 Request: {
  method: 'GET',
  url: '/api/users',
  params: { page: 1, limit: 10 },
  headers: { Authorization: 'Bearer xxx' }
}

✅ Response: {
  status: 200,
  data: { users: [...] },
  url: '/api/users'
}
```

### 2. 错误日志

详细的错误信息会打印到控制台，便于调试。

## 注意事项

1. **Token 格式**: 默认使用 `Bearer` 格式，如需修改请在请求拦截器中调整
2. **错误处理**: 所有错误都会自动显示消息提示，无需手动处理
3. **文件上传**: 使用 `FormData` 格式，会自动设置正确的 `Content-Type`
4. **文件下载**: 会自动创建下载链接并触发下载
5. **认证检查**: 使用 `isAuthenticated()` 检查登录状态

## 扩展功能

### 1. 添加自定义请求头

```javascript
import { setHeader } from '@/utils/request';

setHeader('X-Custom-Header', 'custom-value');
```

### 2. 移除请求头

```javascript
import { removeHeader } from '@/utils/request';

removeHeader('X-Custom-Header');
```

### 3. 自定义配置

```javascript
// 在请求方法中传入额外配置
const response = await get('/api/data', {}, {
  timeout: 5000,
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

这个请求工具提供了完整的 HTTP 请求功能，可以满足大部分前端项目的需求。

## 文件夹删除API更新说明 

### 新增的删除方法

我们新增了基于自增ID的删除方法，推荐使用此方法：

```javascript
import { folderAPI } from '@/utils/api';

// 推荐：使用自增folderId删除文件夹
const deleteFolderByAutoId = async (autoFolderId) => {
  try {
    const result = await folderAPI.deleteFolderByFolderId(autoFolderId);
    console.log('删除成功:', result);
    console.log(`删除统计 - 文件夹: ${result.data.deletedFoldersCount}, 文档: ${result.data.deletedDocumentsCount}`);
    return result;
  } catch (error) {
    console.error('删除失败:', error);
  }
};

// 兼容：使用MongoDB ID删除文件夹（兼容旧代码）
const deleteFolderByMongoId = async (mongoId) => {
  try {
    const result = await folderAPI.deleteFolder(mongoId);
    console.log('删除成功:', result);
    return result;
  } catch (error) {
    console.error('删除失败:', error);
  }
};
```

### 组件中的使用

在 `folderMenu.jsx` 组件中，删除操作已经更新为优先使用自增ID：

```javascript
// 获取文件夹的自增ID
const folderItem = folderUtils.findNodeByKey(folderList, key);
const autoFolderId = folderItem?.autoFolderId || 
  folderItem?.backendData?.autoFolderId || 
  folderItem?.backendData?.folderId;

// 优先使用自增ID删除
const response = (typeof autoFolderId === 'number' && autoFolderId > 0) 
  ? await folderAPI.deleteFolderByFolderId(autoFolderId)
  : await folderAPI.deleteFolder(key);
```

### API对比

| 特性 | 新方法 (`deleteFolderByFolderId`) | 旧方法 (`deleteFolder`) |
|------|-----------------------------------|-------------------------|
| 参数类型 | 自增ID (number) | MongoDB ObjectId (string) |
| API路径 | `/folder/deleteFolderByFolderId/:folderId` | `/folder/deleteFolderById/:id` |
| 推荐程度 | ✅ 推荐使用 | ⚠️ 兼容旧代码 |
| 删除方式 | 基于自增ID递归删除 | 基于MongoDB ID递归删除 | 