import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    modules: {
      // 启用 CSS Modules
      localsConvention: 'camelCase', // 支持驼峰命名
      generateScopedName: '[name]__[local]___[hash:base64:5]', // 自定义类名生成规则
    },
    preprocessorOptions: {
      less: {
        // Less 配置
        javascriptEnabled: true, // 支持 JavaScript 表达式
        modifyVars: {
          // 可以在这里定义全局 Less 变量
          'primary-color': '#1890ff',
        },
      },
    },
  },
});
