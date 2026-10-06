'use strict';

const security = require('eslint-plugin-security');

// Base rule set: the plugin's own recommended rules, plus one general
// hygiene rule this folder also wants enforced.
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
