import { instance } from '@/utils';

// 注册逻辑
export const register = data => {
  return instance.post('/ues/', data);
};

//登陆逻辑
export const login = data => {
  return instance.post('/ues/login', data);
};
