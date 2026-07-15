import eslint from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceFiles = ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'];
const memberSourceFiles = ['apps/web-member/**/*.{js,jsx,ts,tsx}'];
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/coverage/**', '**/generated/**', '**/*.d.ts'],
  },
  {
    ...eslint.configs.recommended,
    files: sourceFiles,
    languageOptions: {
      ...eslint.configs.recommended.languageOptions,
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: {
      ...eslint.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    // Next 15 checks the config file itself when detecting flat-config plugins.
    files: ['eslint.config.mjs'],
    plugins: { '@next/next': nextPlugin },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      ...config.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  })),
  ...compat.extends('next/core-web-vitals').map((config) => ({
    ...config,
    files: memberSourceFiles,
  })),
  {
    files: memberSourceFiles,
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Existing internal anchors are tracked for incremental migration to next/link.
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  {
    files: ['**/support/support-command.service.ts', '**/common/security/input-normalization.ts'],
    rules: {
      'no-control-regex': 'off',
    },
  },
  {
    files: ['**/topups/deposit-workflow.service.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^EvidenceRow$',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['**/web-admin/app/(admin)/bank-accounts/page.tsx', '**/web-admin/app/accept-invitation/page.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^canView$|^languageRowStyle$',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['**/web-member/app/support/page.tsx'],
    rules: {
      'no-empty': 'off',
    },
  },
);
