import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000, // 请求超时时间
});

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么

    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  async response => {
    // 对响应数据做点什么
    if (response.status === 200) {
      return response.data;
    } else {
      // 如果响应状态码不是200，抛出错误
      throw new Error(`Error: ${response.status}`);
    }
  },
  error => {
    // 对响应错误做点什么
    console.error('Response error:', error);
    if (error.response) {
      // 请求已发出，服务器响应了状态码，但状态码超出了2xx的范围
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('Request data:', error.request);
    } else {
      // 发生了其他错误
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  },
);

export default instance;
