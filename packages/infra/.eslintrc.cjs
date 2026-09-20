module.exports = {
  root: true,
  env: { node: true, es2021: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', 'cdk.out', 'node_modules', '*.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
};
