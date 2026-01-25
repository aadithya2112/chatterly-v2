import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'ChatterlyWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      // Make sure we rely on browser APIs
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})