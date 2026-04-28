/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义项目 ESLint 规则与检查范围配置。
 */

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/storybook-static/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/.docusaurus/**',
      '**/.visual-qa/**',
      '**/next-env.d.ts',
      '**/coverage/**',
      // Generated / vendored static assets — not source.
      '**/public/**',
      '**/pdf.worker*.mjs',
    ],
  },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: 'apps/docs/',
      },
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        console: 'readonly',
        process: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
      'no-undef': 'off',
    },
    settings: { react: { version: '18.3.1' } },
  },
  {
    files: ['apps/docs/**/*.{js,jsx,ts,tsx}'],
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
  prettier,
];
