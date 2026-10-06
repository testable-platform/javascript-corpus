const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    target: 'node18',
  },
});
