import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
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
});
