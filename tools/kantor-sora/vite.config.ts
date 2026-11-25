import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error modul JS biasa
import { istanaLucifer } from './server/api.mjs';

export default defineConfig({
  plugins: [react(), istanaLucifer()],
  server: { port: 5180, strictPort: true, host: 'localhost', watch: { ignored: ['**/data/**'] } },
});
