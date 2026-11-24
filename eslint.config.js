// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const jestGlobals = Object.fromEntries(
  ['describe', 'test', 'it', 'expect', 'jest', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll'].map((name) => [
    name,
    'readonly',
  ]),
);

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: { globals: jestGlobals },
  },
]);
