import { GitIgnore } from '../src/utils/gitignore.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('GitIgnore', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitignore-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Pattern matching', () => {
    it('should ignore .git directory', () => {
      const gitIgnore = new GitIgnore();

      expect(gitIgnore.isIgnored('.git')).toBe(true);
      expect(gitIgnore.isIgnored('.git/config')).toBe(true);
      expect(gitIgnore.isIgnored('src/.git/hooks')).toBe(true);
    });

    it('should handle simple file patterns', () => {
      const gitIgnore = new GitIgnore('*.log\n*.tmp');

      expect(gitIgnore.isIgnored('error.log')).toBe(true);
      expect(gitIgnore.isIgnored('debug.tmp')).toBe(true);
      expect(gitIgnore.isIgnored('src/app.log')).toBe(true);
      expect(gitIgnore.isIgnored('src/test.js')).toBe(false);
    });

    it('should handle directory patterns', () => {
      const gitIgnore = new GitIgnore('node_modules/\ndist/\nbuild/');

      expect(gitIgnore.isIgnored('node_modules')).toBe(true);
      expect(gitIgnore.isIgnored('node_modules/express')).toBe(true);
      expect(gitIgnore.isIgnored('src/node_modules/test')).toBe(true);
      expect(gitIgnore.isIgnored('dist/bundle.js')).toBe(true);
      expect(gitIgnore.isIgnored('src/dist/main.js')).toBe(true);
      expect(gitIgnore.isIgnored('src/components')).toBe(false);
    });

    it('should handle absolute patterns', () => {
      const gitIgnore = new GitIgnore('/config.json\n/secret.env');

      expect(gitIgnore.isIgnored('config.json')).toBe(true);
      expect(gitIgnore.isIgnored('secret.env')).toBe(true);
      expect(gitIgnore.isIgnored('src/config.json')).toBe(false);
      expect(gitIgnore.isIgnored('src/secret.env')).toBe(false);
    });

    it('should handle negation patterns', () => {
      const gitIgnore = new GitIgnore('*.log\n!important.log');

      expect(gitIgnore.isIgnored('error.log')).toBe(true);
      expect(gitIgnore.isIgnored('debug.log')).toBe(true);
      expect(gitIgnore.isIgnored('important.log')).toBe(false);
      expect(gitIgnore.isIgnored('src/important.log')).toBe(false);
    });

    it('should handle complex patterns with wildcards', () => {
      const gitIgnore = new GitIgnore('test-*\n*.test.js\n**/*.tmp');

      expect(gitIgnore.isIgnored('test-output')).toBe(true);
      expect(gitIgnore.isIgnored('test-results')).toBe(true);
      expect(gitIgnore.isIgnored('app.test.js')).toBe(true);
      expect(gitIgnore.isIgnored('src/components/button.test.js')).toBe(true);
      expect(gitIgnore.isIgnored('any/deep/path/file.tmp')).toBe(true);
      expect(gitIgnore.isIgnored('src/app.js')).toBe(false);
    });

    it('should ignore comments and empty lines', () => {
      const gitIgnore = new GitIgnore(`
# This is a comment
*.log

# Another comment
node_modules/

`);

      expect(gitIgnore.isIgnored('error.log')).toBe(true);
      expect(gitIgnore.isIgnored('node_modules/express')).toBe(true);
      expect(gitIgnore.getPatterns().patterns).toEqual(['*.log', 'node_modules/']);
    });
  });

  describe('File operations', () => {
    it('should load from file', () => {
      const gitignoreContent = 'node_modules/\n*.log\ndist/';
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, gitignoreContent);

      const gitIgnore = GitIgnore.fromFile(gitignorePath);

      expect(gitIgnore.isIgnored('node_modules/express')).toBe(true);
      expect(gitIgnore.isIgnored('error.log')).toBe(true);
      expect(gitIgnore.isIgnored('dist/bundle.js')).toBe(true);
      expect(gitIgnore.hasPatterns()).toBe(true);
    });

    it('should handle missing .gitignore file', () => {
      const nonExistentPath = path.join(tempDir, 'missing', '.gitignore');
      const gitIgnore = GitIgnore.fromFile(nonExistentPath);

      expect(gitIgnore.hasPatterns()).toBe(false);
      expect(gitIgnore.isIgnored('any-file.js')).toBe(false);
      expect(gitIgnore.isIgnored('.git/config')).toBe(true); // .git is always ignored
    });

    it('should load from repository', () => {
      const gitignoreContent = 'coverage/\n*.env\ntest-output/';
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, gitignoreContent);

      const gitIgnore = GitIgnore.fromRepository(tempDir);

      expect(gitIgnore.isIgnored('coverage/lcov.info')).toBe(true);
      expect(gitIgnore.isIgnored('production.env')).toBe(true);
      expect(gitIgnore.isIgnored('test-output/results.json')).toBe(true);
      expect(gitIgnore.isIgnored('src/app.js')).toBe(false);
    });
  });

  describe('Common patterns', () => {
    it('should handle typical JavaScript project patterns', () => {
      const gitIgnore = new GitIgnore(`
node_modules/
dist/
build/
coverage/
*.log
.env
.env.*
!.env.example
.DS_Store
Thumbs.db
`);

      // Should ignore
      expect(gitIgnore.isIgnored('node_modules/react')).toBe(true);
      expect(gitIgnore.isIgnored('dist/bundle.js')).toBe(true);
      expect(gitIgnore.isIgnored('build/static/css/main.css')).toBe(true);
      expect(gitIgnore.isIgnored('coverage/lcov.info')).toBe(true);
      expect(gitIgnore.isIgnored('npm-debug.log')).toBe(true);
      expect(gitIgnore.isIgnored('.env')).toBe(true);
      expect(gitIgnore.isIgnored('.env.production')).toBe(true);
      expect(gitIgnore.isIgnored('.DS_Store')).toBe(true);

      // Should not ignore
      expect(gitIgnore.isIgnored('.env.example')).toBe(false);
      expect(gitIgnore.isIgnored('src/app.js')).toBe(false);
      expect(gitIgnore.isIgnored('public/index.html')).toBe(false);
    });

    it('should handle typical Git Spark project patterns', () => {
      const gitIgnore = new GitIgnore(`
node_modules/
dist/
coverage/
test-*
reports/
*.log
.env
`);

      // Should ignore
      expect(gitIgnore.isIgnored('node_modules/@types/node')).toBe(true);
      expect(gitIgnore.isIgnored('dist/src/index.js')).toBe(true);
      expect(gitIgnore.isIgnored('coverage/lcov-report/index.html')).toBe(true);
      expect(gitIgnore.isIgnored('test-output')).toBe(true);
      expect(gitIgnore.isIgnored('test-final')).toBe(true);
      expect(gitIgnore.isIgnored('test-charts/demo.html')).toBe(true);
      expect(gitIgnore.isIgnored('reports/analysis.html')).toBe(true);
      expect(gitIgnore.isIgnored('npm-debug.log')).toBe(true);
      expect(gitIgnore.isIgnored('.env')).toBe(true);

      // Should not ignore
      expect(gitIgnore.isIgnored('src/core/analyzer.ts')).toBe(false);
      expect(gitIgnore.isIgnored('test/analyzer.test.ts')).toBe(false);
      expect(gitIgnore.isIgnored('README.md')).toBe(false);
      expect(gitIgnore.isIgnored('package.json')).toBe(false);
    });
  });
});
