import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/learn-math/',
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  build: { target: 'es2022', assetsInlineLimit: 0 },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
