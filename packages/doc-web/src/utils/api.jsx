/**
 * api文件，用于封装所有API请求，方便统一管理，可以改造要用的接口路径，在外部调用
 * 以下api，处理登录注册是写好的，其他的都是模拟的，需要自己写
 */
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
  updateProfile: (userId, data) => put(`/user/userId/${userId}`, data),

  // 获取用户统计信息
  getUserStats: () => get('/user/stats'),

  // 修改密码
  changePassword: data => patch('/user/password', data),

  // 修改用户公开状态
  changePublicStatus: email => patch('/user/isPublic/' + email),

  // 用户登出
  logout: () => post('/auth/logout'),

  // 根据userId删除用户
  deleteUser: userId => del(`/user/userId/${userId}`),
};

/**
 * 最近访问记录相关API
 */
export const recentVisitsAPI = {
  // 创建最近访问记录
  createVisit: data => post('/recent-visits', data),

  // 根据用户ID获取最近访问记录（分页）
  getUserVisits: data =>
    get(`/recent-visits/getRecentVisitsByUserId/${data.userId}`, {
      page: data.page,
      pageSize: data.pageSize,
    }),

  // 获取所有最近访问记录
  getAllVisits: () => get('/recent-visits'),

  // 获取单个访问记录
  getVisit: id => get(`/recent-visits/getRecentVisitsById/${id}`),

  // 更新访问记录
  updateVisit: (id, data) =>
    patch(`/recent-visits/updateRecentVisits/${id}`, data),

  // 删除访问记录
  deleteVisit: id => del(`/recent-visits/deleteRecentVisits/${id}`),

  // 清空用户的所有访问记录
  clearUserVisits: userId =>
    del(`/recent-visits/deleteAllRecentVisits/${userId}/clear`),
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
  // 获取文件夹树形结构列表
  getFolders: params => get('/folder/getFoldersList', params),

  // 获取文件夹树形结构（备用接口）
  getFolderTree: params => get('/folder/getFoldersTree', params),

  // 获取单个文件夹详情
  getFolder: id => get(`/folder/getFolderDetailById/${id}`),

  // 创建文件夹
  createFolder: data => post('/folder/create', data),

  // 更新文件夹
  updateFolder: (id, data) => patch(`/folder/update/${id}`, data),

  // 删除文件夹
  deleteFolder: id => del(`/folder/deleteFolderById/${id}`),

  // 移动文件夹（保留，后续可能实现）
  moveFolder: (id, targetParentFolderIds) =>
    patch(`/folder/${id}/move`, { parentFolderIds: targetParentFolderIds }),

  // 获取文件夹内容（保留，后续可能实现）
  getFolderContents: id => get(`/folder/${id}/contents`),
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
