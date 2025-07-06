// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // eslintPluginPrettierRecommended, // 关闭 Prettier 格式检查
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'no-unused-vars': 'off',
      // 关闭所有格式相关规则
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'comma-spacing': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'space-before-blocks': 'off',
      'keyword-spacing': 'off',
      'space-infix-ops': 'off',
      'space-before-function-paren': 'off',
      'arrow-spacing': 'off',
      'object-property-newline': 'off',
      'array-element-newline': 'off',
      'function-paren-newline': 'off',
      'object-curly-newline': 'off',
      'array-bracket-newline': 'off',
      'computed-property-spacing': 'off',
      'key-spacing': 'off',
      'brace-style': 'off',
      'max-len': 'off',
      'no-trailing-spaces': 'off',
      'eol-last': 'off',
      'no-multiple-empty-lines': 'off',
      'padded-blocks': 'off',
      'spaced-comment': 'off',
      'operator-linebreak': 'off',
      'implicit-arrow-linebreak': 'off',
      'function-call-argument-newline': 'off',
      'prettier/prettier': 'off', // 关闭 Prettier 规则
    },
  },
);
