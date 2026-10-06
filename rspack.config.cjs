module.exports = {
  entry: './src/index.js',
  target: 'node',
  mode: 'production',
  output: {
    filename: 'index.js',
    path: __dirname + '/dist',
    library: { type: 'commonjs2' },
  },
};
