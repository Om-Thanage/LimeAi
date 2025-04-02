import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src')
    },
  },
  // Add build configuration for proper asset handling
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate a clean build
    emptyOutDir: true,
    // Improve chunking strategy
    // rollupOptions: {
    //   output: {
    //     manualChunks: {
    //       vendor: ['react', 'react-dom', 'react-router-dom'],
    //     },
    //   },
    // },
  },
  // Ensure proper base path for production
  base: '/',
})