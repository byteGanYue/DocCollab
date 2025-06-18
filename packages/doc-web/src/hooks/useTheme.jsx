import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

/**
 * 获取主题上下文
 *
 * @returns 返回主题上下文对象
 * @throws 若未使用 ThemeProvider 包裹组件，则抛出错误
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
