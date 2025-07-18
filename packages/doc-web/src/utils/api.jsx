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

  // 修改用户公开状态 - 切换用户工作空间的公开/私有状态
  changePublicStatus: (email, isPublic) =>
    patch('/user/isPublic/' + email, { isPublic }),

  // 用户登出
  logout: () => post('/auth/logout'),

  // 根据userId删除用户
  deleteUser: userId => del(`/user/userId/${userId}`),

  //根据用户ID获取用户信息
  getUserInfo: userId => get(`/user/getUserInfoByUserId/${userId}`),
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
  getDocuments: params => get('/document/getDocumentsList', params),

  // 获取单个文档详情，需要传递userId参数
  getDocument: (documentId, userId) =>
    get(`/document/getDocumentById/${documentId}?userId=${userId}`),

  // 创建文档
  createDocument: data => post('/document/create', data),

  // 更新文档
  updateDocument: (documentId, data) =>
    patch(`/document/update/${documentId}`, data),

  // 删除文档
  deleteDocument: documentId =>
    del(`/document/deleteDocumentByDocumentId/${documentId}`),

  // 添加协同编辑者
  addCollaborator: (documentId, userId) =>
    post(`/document/${documentId}/editors`, { userId }),

  // 移除协同编辑者
  removeCollaborator: (documentId, userId) =>
    del(`/document/${documentId}/editors/${userId}`),

  // 根据用户ID获取文档列表（使用新的专用接口）
  getUserDocuments: (userId, params = {}) =>
    get(`/document/getUserDocuments/${userId}`, params),

  // 根据父文件夹ID获取文档列表
  getFolderDocuments: (parentFolderId, userId, params = {}) =>
    get('/document/getDocumentsList', { parentFolderId, userId, ...params }),

  // 搜索文档
  searchDocuments: (search, params = {}) =>
    get('/document/getDocumentsList', { search, ...params }),

  // 搜索文档内容
  searchDocumentsContent: (params = {}) => get('/document/search', params),

  // 获取文档历史版本
  getDocumentHistory: (documentId, page = 1, limit = 20) =>
    get(`/document/${documentId}/history`, { page, limit }),

  // 获取特定版本的文档内容
  getDocumentVersion: (documentId, versionId) =>
    get(`/document/${documentId}/version/${versionId}`),

  // 恢复文档版本
  restoreDocument: (documentId, versionId) =>
    post(`/document/${documentId}/restore`, { versionId }),

  // 恢复归档历史版本
  restoreArchivedHistory: documentId =>
    post(`/document/${documentId}/history/restore`),

  // 导出文档（保留，后续可能实现）
  exportDocument: (documentId, format) =>
    download(`/document/${documentId}/export`, { format }),

  // 上传文档附件（保留，后续可能实现）
  uploadAttachment: (documentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return upload(`/document/${documentId}/attachments`, formData);
  },

  // 创建文档历史版本记录
  createDocumentHistory: async (documentId, content, yjsState, username) => {
    return post(`/document/${documentId}/create-history`, {
      content,
      yjsState,
      username,
    });
  },

  // 同步 Yjs 协同状态到后端
  syncYjsState: (documentId, yjsState, content, username) => {
    return post(`/document/${documentId}/sync-yjs`, {
      yjsState,
      content,
      username,
    });
  },

  // 获取所有公开用户的文档
  getPublicDocuments: () => get('/document/public-documents'),

  // 获取指定文件夹下的公开文档
  getPublicDocumentsByFolder: folderIds =>
    get(`/document/public-documents/folder/${folderIds.join(',')}`),
};

/**
 * 文件夹相关API
 */
export const folderAPI = {
  // 获取文件夹树形结构列表
  getFolders: params => get('/folder/getFoldersList', params),

  // 获取文件夹树形结构（备用接口）
  getFolderTree: params => get('/folder/getFoldersTree', params),

  // 获取单个文件夹详情（使用MongoDB ID）
  getFolder: id => get(`/folder/getFolderDetailById/${id}`),

  // 根据自增folderId获取文件夹详情
  getFolderByFolderId: folderId =>
    get(`/folder/getFolderDetailByFolderId/${folderId}`),

  // 创建文件夹
  createFolder: data => post('/folder/create', data),

  // 更新文件夹（使用自增folderId）- 推荐使用此方法
  updateFolder: (folderId, data) => patch(`/folder/update/${folderId}`, data),

  // 更新文件夹（使用MongoDB ID）- 兼容旧代码
  updateFolderById: (id, data) => patch(`/folder/updateById/${id}`, data),

  // 删除文件夹（使用MongoDB ID）- 兼容旧代码
  deleteFolder: id => del(`/folder/deleteFolderById/${id}`),

  // 根据自增folderId删除文件夹（推荐使用此方法）
  deleteFolderByFolderId: folderId =>
    del(`/folder/deleteFolderByFolderId/${folderId}`),

  // 移动文件夹（保留，后续可能实现）
  moveFolder: (id, targetParentFolderIds) =>
    patch(`/folder/${id}/move`, { parentFolderIds: targetParentFolderIds }),

  // 获取文件夹内容（保留，后续可能实现）
  getFolderContents: id => get(`/folder/${id}/contents`),

  // 获取所有公开用户的文件夹结构
  getPublicFolders: () => get('/folder/public-folders'),

  // 按名称搜索文件夹
  searchFolders: params => get('/folder/search', params),
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
 *
 * // 6. 文件夹操作示例
 * const createFolder = async (folderData) => {
 *   try {
 *     const folder = await folderAPI.createFolder(folderData);
 *     return folder;
 *   } catch (error) {
 *     console.error('创建文件夹失败:', error);
 *     throw error;
 *   }
 * };
 *
 * // 7. 更新文件夹（使用自增folderId）
 * const updateFolder = async (folderId, folderName) => {
 *   try {
 *     const result = await folderAPI.updateFolder(folderId, { folderName });
 *     return result;
 *   } catch (error) {
 *     console.error('更新文件夹失败:', error);
 *     throw error;
 *   }
 * };
 *
 * // 8. 获取文件夹详情（使用自增folderId）
 * const getFolderDetails = async (folderId) => {
 *   try {
 *     const folder = await folderAPI.getFolderByFolderId(folderId);
 *     return folder;
 *   } catch (error) {
 *     console.error('获取文件夹详情失败:', error);
 *     throw error;
 *   }
 * };
 *
 * // 9. 修改用户工作空间权限
 * const changeUserPermission = async (email, isPublic) => {
 *   try {
 *     const response = await userAPI.changePublicStatus(email, isPublic);
 *     if (response.success) {
 *       console.log('用户权限修改成功:', response);
 *       return response;
 *     } else {
 *       throw new Error(response.message || '权限修改失败');
 *     }
 *   } catch (error) {
 *     console.error('修改用户权限失败:', error);
 *     throw error;
 *   }
 * };
 */
