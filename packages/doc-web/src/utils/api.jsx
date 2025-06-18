import {
  get,
  post,
  put,
  patch,
  del,
  upload,
  download,
  setToken,
  getToken,
  clearToken,
  isAuthenticated,
} from './request';

/**
 * 用户相关API
 */
export const userAPI = {
  // 用户登录
  login: data => post('/user/login', data),

  // 用户注册
  register: data => post('/user/register', data),

  // 获取用户信息
  getProfile: () => get('/user/profile'),

  // 更新用户信息
  updateProfile: data => put('/user/profile', data),

  // 修改密码
  changePassword: data => patch('/user/password', data),

  // 用户登出
  logout: () => post('/auth/logout'),
};

/**
 * 文档相关API
 */
export const documentAPI = {
  // 获取文档列表
  getDocuments: params => get('/documents', params),

  // 获取单个文档
  getDocument: id => get(`/documents/${id}`),

  // 创建文档
  createDocument: data => post('/documents', data),

  // 更新文档
  updateDocument: (id, data) => put(`/documents/${id}`, data),

  // 删除文档
  deleteDocument: id => del(`/documents/${id}`),

  // 获取文档历史版本
  getDocumentHistory: id => get(`/documents/${id}/history`),

  // 恢复文档版本
  restoreDocument: (id, versionId) =>
    post(`/documents/${id}/restore`, { versionId }),

  // 导出文档
  exportDocument: (id, format) =>
    download(`/documents/${id}/export`, { format }),

  // 上传文档附件
  uploadAttachment: (documentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return upload(`/documents/${documentId}/attachments`, formData);
  },
};

/**
 * 文件夹相关API
 */
export const folderAPI = {
  // 获取文件夹列表
  getFolders: params => get('/folders', params),

  // 获取单个文件夹
  getFolder: id => get(`/folders/${id}`),

  // 创建文件夹
  createFolder: data => post('/folders', data),

  // 更新文件夹
  updateFolder: (id, data) => put(`/folders/${id}`, data),

  // 删除文件夹
  deleteFolder: id => del(`/folders/${id}`),

  // 移动文件夹
  moveFolder: (id, targetId) => patch(`/folders/${id}/move`, { targetId }),

  // 获取文件夹内容
  getFolderContents: id => get(`/folders/${id}/contents`),
};

/**
 * 协作相关API
 */
export const collaborationAPI = {
  // 获取文档协作者
  getCollaborators: documentId => get(`/documents/${documentId}/collaborators`),

  // 添加协作者
  addCollaborator: (documentId, data) =>
    post(`/documents/${documentId}/collaborators`, data),

  // 移除协作者
  removeCollaborator: (documentId, userId) =>
    del(`/documents/${documentId}/collaborators/${userId}`),

  // 更新协作者权限
  updateCollaboratorPermission: (documentId, userId, permission) =>
    patch(`/documents/${documentId}/collaborators/${userId}`, { permission }),

  // 获取在线用户
  getOnlineUsers: documentId => get(`/documents/${documentId}/online-users`),
};

/**
 * 评论相关API
 */
export const commentAPI = {
  // 获取文档评论
  getComments: documentId => get(`/documents/${documentId}/comments`),

  // 添加评论
  addComment: (documentId, data) =>
    post(`/documents/${documentId}/comments`, data),

  // 更新评论
  updateComment: (documentId, commentId, data) =>
    put(`/documents/${documentId}/comments/${commentId}`, data),

  // 删除评论
  deleteComment: (documentId, commentId) =>
    del(`/documents/${documentId}/comments/${commentId}`),

  // 回复评论
  replyComment: (documentId, commentId, data) =>
    post(`/documents/${documentId}/comments/${commentId}/replies`, data),
};

/**
 * 认证工具函数
 */
export const authUtils = {
  // 设置认证token
  setAuthToken: token => {
    setToken(token);
  },

  // 获取认证token
  getAuthToken: () => {
    return getToken();
  },

  // 清除认证信息
  clearAuth: () => {
    clearToken();
  },

  // 检查是否已认证
  isAuth: () => {
    return isAuthenticated();
  },
};

/**
 * 使用示例：
 *
 * // 1. 用户登录
 * const loginUser = async (email, password) => {
 *   try {
 *     const response = await userAPI.login({ email, password });
 *     authUtils.setAuthToken(response.token);
 *     return response;
 *   } catch (error) {
 *     console.error('登录失败:', error);
 *     throw error;
 *   }
 * };
 *
 * // 2. 获取文档列表
 * const getDocuments = async () => {
 *   try {
 *     const documents = await documentAPI.getDocuments({ page: 1, limit: 10 });
 *     return documents;
 *   } catch (error) {
 *     console.error('获取文档失败:', error);
 *     throw error;
 *   }
 * };
 *
 * // 3. 创建文档
 * const createNewDocument = async (title, content) => {
 *   try {
 *     const document = await documentAPI.createDocument({ title, content });
 *     return document;
 *   } catch (error) {
 *     console.error('创建文档失败:', error);
 *     throw error;
 *   }
 * };
 *
 * // 4. 上传文件
 * const uploadFile = async (documentId, file) => {
 *   try {
 *     const result = await documentAPI.uploadAttachment(documentId, file);
 *     return result;
 *   } catch (error) {
 *     console.error('上传文件失败:', error);
 *     throw error;
 *   }
 * };
 *
 * // 5. 下载文档
 * const downloadDocument = async (documentId, format = 'pdf') => {
 *   try {
 *     await documentAPI.exportDocument(documentId, format);
 *   } catch (error) {
 *     console.error('下载文档失败:', error);
 *     throw error;
 *   }
 * };
 */
