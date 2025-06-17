// 主题配置
export const themes = {
  purple: {
    name: '深空紫',
    description: '高端深空紫主题',
    colors: {
      primary: '#805AD5',
      background: '#FAF5FF',
      hover: '#6B46C1',
      text: '#2D3748',
      textSecondary: '#4A5568',
      border: '#E2E8F0',
      success: '#48BB78',
      warning: '#ED8936',
      error: '#F56565',
    },
  },
  blue: {
    name: '协作蓝',
    description: '专业协作蓝主题',
    colors: {
      primary: '#3A86FF',
      background: '#F0F7FF',
      hover: '#1A3A8F',
      text: '#1A202C',
      textSecondary: '#4A5568',
      border: '#E2E8F0',
      success: '#48BB78',
      warning: '#ED8936',
      error: '#F56565',
    },
  },
  green: {
    name: '生态绿',
    description: '生态友好绿主题',
    colors: {
      primary: '#48BB78',
      background: '#F0FFF4',
      hover: '#2F855A',
      text: '#2D3748',
      textSecondary: '#4A5568',
      border: '#E2E8F0',
      success: '#38A169',
      warning: '#ED8936',
      error: '#F56565',
    },
  },
};

// 默认主题
export const defaultTheme = 'purple';

// 主题切换器配置
export const themeOptions = [
  {
    key: 'purple',
    label: '深空紫',
    icon: '🟣',
    description: '高端深空紫主题',
  },
  {
    key: 'blue',
    label: '协作蓝',
    icon: '🔵',
    description: '专业协作蓝主题',
  },
  {
    key: 'green',
    label: '生态绿',
    icon: '🟢',
    description: '生态友好绿主题',
  },
];
