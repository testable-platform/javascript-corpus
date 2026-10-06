const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    lib: {
      entry: 'packages/api/src/index.js',
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    target: 'node18',
  },
});
