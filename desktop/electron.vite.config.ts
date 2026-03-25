import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const viteApiOrigin = env.VITE_API_ORIGIN ?? 'http://localhost:8080';

  return {
    main: {
      resolve: {
        alias: {
          '@': resolve('src'),
          '@resources': resolve('resources'),
        },
      },
      define: {
        'process.env.VITE_API_ORIGIN': JSON.stringify(viteApiOrigin),
      },
      plugins: [
        externalizeDepsPlugin({
          exclude: ['electron-store'],
        }),
      ],
    },
    preload: {
      resolve: {
        alias: {
          '@': resolve('src'),
          '@resources': resolve('resources'),
        },
      },
      define: {
        'process.env.VITE_API_ORIGIN': JSON.stringify(viteApiOrigin),
      },
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      resolve: {
        alias: {
          '@': resolve('src'),
          '@resources': resolve('resources'),
        },
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'src/renderer/index.html'),
            calendar: resolve(__dirname, 'src/renderer/calendar.html'),
            dayDetail: resolve(__dirname, 'src/renderer/dayDetail.html'),
            auth: resolve(__dirname, 'src/renderer/auth.html'),
          },
        },
      },
    },
  };
});
