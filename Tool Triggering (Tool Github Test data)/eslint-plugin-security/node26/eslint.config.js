'use strict';

const security = require('eslint-plugin-security');

const baseRules = { ...security.configs.recommended.rules };
baseRules['no-unused-vars'] = 'error';

module.exports = [
  {
    files: ['src/**/*.js', 'test/**/*.js'],
    plugins: { security },
    rules: baseRules,
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2022,
      globals: { describe: 'readonly', it: 'readonly', module: 'readonly', require: 'readonly' },
    },
  },
];
