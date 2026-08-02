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
  },
});