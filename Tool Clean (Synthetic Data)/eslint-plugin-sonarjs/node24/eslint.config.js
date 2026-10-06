'use strict';

const sonarjs = require('eslint-plugin-sonarjs');

module.exports = [
  {
    files: ['src/**/*.js', 'test/**/*.js'],
    plugins: { sonarjs },
    languageOptions: {
      globals: {
        it: 'readonly',
        describe: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
      sourceType: 'commonjs',
      ecmaVersion: 2022,
    },
    rules: Object.assign(
      {},
      sonarjs.configs.recommended.rules,
      { 'no-unused-vars': 'error' },
    ),
  },
];
