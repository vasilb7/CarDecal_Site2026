import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        sourcemap: false,
        minify: 'esbuild',
        cssMinify: true,
        target: 'es2020',
        rollupOptions: {
          output: {
            manualChunks: {
              // Core React runtime
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              // Animation library (heavy)
              'framer': ['framer-motion'],
              // Supabase client
              'supabase': ['@supabase/supabase-js'],
              // i18n
              'i18n': ['i18next', 'react-i18next'],
              // Icons (tree-shaken but still big)
              'icons': ['lucide-react'],
              // Zoom library
              'zoom': ['react-zoom-pan-pinch'],
              // PDF generation (used only in receipt/admin, heavy)
              'pdf': ['jspdf', 'jspdf-autotable'],
              // Password strength  
              'zxcvbn': ['zxcvbn'],
              // ML models (used only in admin/moderation)
              'tensorflow': ['@tensorflow/tfjs'],
              'nsfw': ['nsfwjs'],
              // Image cropper
              'cropper': ['@origin-space/image-cropper'],
            },
          },
        },
      },
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
    };
});
