const { defineConfig } = require('vitest/config');
const path = require('node:path');

module.exports = defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 30000, // 30 segundos para tests largos
    // Disable worker threads on Windows CI/local where spawning may fail
    threads: false,
    // Run tests in the same process to avoid fork/worker issues on Windows
    isolate: true,
    maxConcurrency: 1,
    // Solo correr unit tests de vitest; los specs de e2e los ejecuta Playwright
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/test-results/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types/',
      ],
    },
  },
});