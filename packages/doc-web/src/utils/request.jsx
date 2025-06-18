import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const instance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');

    // 如果存在token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 打印请求信息（开发环境）
    if (import.meta.env.DEV) {
      console.log('🚀 Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
        headers: config.headers,
      });
    }

    return config;
  },
  error => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // 打印响应信息（开发环境）
    if (import.meta.env.DEV) {
      console.log('✅ Response:', {
        status: response.status,
        data: response.data,
        url: response.config.url,
      });
    }

    // 统一处理响应数据
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      throw new Error(`HTTP Error: ${response.status}`);
    }
  },
  error => {
    // 处理响应错误
    let errorMessage = '网络请求失败';

    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;

      switch (status) {
        case 401:
          errorMessage = '未授权，请重新登录';
          // 清除本地token和用户信息
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // 跳转到登录页
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = '权限不足，无法访问';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = data?.message || `请求失败 (${status})`;
      }

      console.error('❌ Response error:', {
        status,
        data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接失败，请检查网络';
      console.error('❌ Network error:', error.request);
    } else {
      // 其他错误
      errorMessage = error.message || '请求配置错误';
      console.error('❌ Request config error:', error.message);
    }

    // 显示错误消息
    message.error(errorMessage);

    return Promise.reject(error);
  },
);

/**
 * 通用请求方法
 * @param {string} method - 请求方法
 * @param {string} url - 请求地址
 * @param {object} data - 请求数据
 * @param {object} config - 额外配置
 * @returns {Promise}
 */
const request = (method, url, data = null, config = {}) => {
  const requestConfig = {
    method,
    url,
    ...config,
  };

  // 根据请求方法设置数据
  if (method.toLowerCase() === 'get' || method.toLowerCase() === 'delete') {
    requestConfig.params = data;
  } else {
    requestConfig.data = data;
  }

  return instance(requestConfig);
};

/**
 * GET请求
 * @param {string} url - 请求地址
 * @param {object} params - 查询参数
 * @param {object} config - 额外配置
 * @returns {Promise}
 */
export const get = (url, params = {}, config = {}) => {
  return request('GET', url, params, config);
};

/**
 * POST请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求数据
 * @param {object} config - 额外配置
 * @returns {Promise}
 */
export const post = (url, data = {}, config = {}) => {
  return request('POST', url, data, config);
};

/**
 * PUT请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求数据
 * @param {object} config - 额外配置
 * @returns {Promise}
 */
export const put = (url, data = {}, config = {}) => {
  return request('PUT', url, data, config);
};

/**
 * PATCH请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求数据
 * @param {object} config - 额外配置
 * @returns {Promise}
 */
export const patch = (url, data = {}, config = {}) => {
  return request('PATCH', url, data, config);
};

/**
 * DELETE请求
 * @param {string} url - 请求地址
 * @param {object} params - 查询参数
 * @param {object} config - 额外配置
 * @returns {Promise}
 */
export const del = (url, params = {}, config = {}) => {
  return request('DELETE', url, params, config);
};

/**
 * 上传文件
 * @param {string} url - 请求地址
 * @param {FormData} formData - 表单数据
 * @param {object} config - 额外配置
 * @returns {Promise}
 */
export const upload = (url, formData, config = {}) => {
  return instance({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...config,
  });
};

/**
 * 下载文件
 * @param {string} url - 请求地址
 * @param {object} params - 查询参数
 * @param {string} filename - 文件名
 * @param {object} config - 额外配置
 * @returns {Promise}
 */
export const download = (url, params = {}, filename = '', config = {}) => {
  return instance({
    method: 'GET',
    url,
    params,
    responseType: 'blob',
    ...config,
  }).then(response => {
    // 创建下载链接
    const blob = new Blob([response]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return response;
  });
};

/**
 * 设置请求头
 * @param {string} key - 头部键名
 * @param {string} value - 头部值
 */
export const setHeader = (key, value) => {
  instance.defaults.headers.common[key] = value;
};

/**
 * 移除请求头
 * @param {string} key - 头部键名
 */
export const removeHeader = key => {
  delete instance.defaults.headers.common[key];
};

/**
 * 设置token
 * @param {string} token - JWT token
 */
export const setToken = token => {
  if (token) {
    localStorage.setItem('token', token);
    setHeader('Authorization', `Bearer ${token}`);
  } else {
    localStorage.removeItem('token');
    removeHeader('Authorization');
  }
};

/**
 * 获取token
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * 清除token
 */
export const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  removeHeader('Authorization');
};

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// 导出默认实例
export default instance;
