import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  // Project Pages is served beneath /repo_ani/, not the domain root.
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
});
