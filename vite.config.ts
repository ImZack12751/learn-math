import { defineConfig } from 'vitest/config';
import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import remarkMath from 'remark-math';
import remarkTex from './scripts/remark-tex';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/learn-math/',
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkMath, remarkTex] }) },
    react({ include: /\.(mdx|tsx|ts)$/ }),
    tailwindcss(),
  ],
  worker: { format: 'es' },
  build: { target: 'es2022', assetsInlineLimit: 0 },
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/content/**', 'src/generators/generators.test.ts'],
        },
      },
      {
        // Content correctness: curriculum, catalogue and the 1,000-seed generator suite.
        extends: true,
        test: {
          name: 'content',
          include: ['src/content/**/*.test.ts', 'src/generators/generators.test.ts'],
          testTimeout: 600_000,
        },
      },
    ],
  },
});
