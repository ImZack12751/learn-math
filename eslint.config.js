import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const pure = (name) => ({
  files: [`src/${name}/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['react', 'react-dom', 'react/*', 'react-router', 'motion', 'motion/*'],
            message: `${name} is pure: no React.`,
          },
          {
            group: ['dexie', 'zustand', 'zustand/*'],
            message: `${name} is pure: no persistence or stores.`,
          },
          {
            group: [
              '**/ui/**',
              '**/pages/**',
              '**/app/**',
              '**/data/**',
              '**/fractal/**',
              '**/themes/**',
            ],
            message: `${name} may not depend on UI, data, fractal or theme modules.`,
          },
        ],
      },
    ],
  },
});

export default tseslint.config(
  { ignores: ['dist', 'public/generated', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  { files: ['**/*.js'], ...tseslint.configs.disableTypeChecked },
  pure('engine'),
  pure('generators'),
  pure('learning'),
  {
    files: ['src/fractal/**/*.ts', 'src/themes/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'zustand', 'zustand/*', 'dexie'],
              message: 'fractal and themes are standalone.',
            },
            {
              group: ['**/ui/**', '**/pages/**', '**/app/**', '**/data/**', '**/content/**'],
              message: 'fractal and themes are standalone.',
            },
          ],
        },
      ],
    },
  },
);
