/* Basic ESLint config */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended'
  ],
  plugins: ['react-refresh'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: {},
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
