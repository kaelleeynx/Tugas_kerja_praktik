import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('development'),
    global: 'globalThis',
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
      include: /src\/.*\.(js|jsx|ts|tsx)$/,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui';
          }
        },
      },
    },
  },
  preview: {
    port: 3000,
    host: 'localhost',
  },
})

