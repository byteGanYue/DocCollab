import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.jsx',
      name: 'DocEditor',
      fileName: format => `doc-editor.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'slate', 'slate-react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          slate: 'Slate',
          'slate-react': 'SlateReact',
        },
      },
    },
  },
  server: {
    open: true,
    port: 5175,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  ...(process.env.NODE_ENV !== 'production' && {
    build: undefined,
    root: '.',
    publicDir: false,
    appType: 'spa',
    optimizeDeps: {
      entries: ['src/examples/HoveringToolbarExample.jsx'],
    },
  }),
});
