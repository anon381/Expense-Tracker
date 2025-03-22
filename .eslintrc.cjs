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
    // Allow intentionally unused args prefixed with _ to signal ignored parameters.
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
