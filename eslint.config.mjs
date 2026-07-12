import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['warn', { args: 'none' }],
      eqeqeq: ['error', 'smart'],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Identifier[name='innerHTML']",
          message:
            'Using innerHTML is forbidden due to XSS risks. Use textContent, document.createElement, and appendChild instead.',
        },
        {
          selector: "Identifier[name='outerHTML']",
          message:
            'Using outerHTML is forbidden due to XSS risks. Use textContent, document.createElement, and appendChild instead.',
        },
        {
          selector: "Identifier[name='insertAdjacentHTML']",
          message:
            'Using insertAdjacentHTML is forbidden due to XSS risks. Use textContent, document.createElement, and appendChild instead.',
        },
        {
          selector:
            "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
          message:
            'Using document.write or document.writeln is forbidden due to XSS risks. Use safer DOM manipulation APIs instead.',
        },
      ],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];
