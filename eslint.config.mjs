import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const sourceFiles = ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/generated/**',
      '**/*.d.ts',
    ],
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
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      ...config.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  })),
);
