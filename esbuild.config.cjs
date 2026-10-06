const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['packages/api/src/index.js'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.js',
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
