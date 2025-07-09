const globals = require('globals');
const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');
const pluginJest = require('eslint-plugin-jest');

module.exports = [
  {
    ignores: ['node_modules/', 'dist/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-console': 'off',
    },
  },
  prettierConfig,
  {
    files: ['tests/**/*.js'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },
];
