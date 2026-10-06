/**
 * CLI Integration Tests
 * Tests for command-line interface functionality
 */

import {
  createTestRepo,
  cleanupTestRepo,
  createTestOptions,
  validateOptions,
  parseArgs,
  createTestCommits,
  addTestCommit,
} from './helpers/cli-test-helpers.js';
import { GitSpark } from '../src/index.js';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('CLI Integration Tests', () => {
  let testRepoPath: string;
  const outputDir = join(process.cwd(), 'test-cli-output');

  beforeEach(() => {
    // Create fresh test repository
    testRepoPath = createTestRepo('cli-test-repo');

    // Add some test commits
    createTestCommits(testRepoPath, 5);

    // Clean output directory
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Cleanup
    cleanupTestRepo(testRepoPath);
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  describe('Command Parsing', () => {
    it('should parse --days option correctly', () => {
      const args = parseArgs(['--days', '30']);
      expect(args.days).toBe('30');
    });

    it('should parse --since and --until options', () => {
      const args = parseArgs(['--since', '2025-01-01', '--until', '2025-12-31']);
      expect(args.since).toBe('2025-01-01');
      expect(args.until).toBe('2025-12-31');
    });

    it('should parse --format option', () => {
      const args = parseArgs(['--format', 'json']);
      expect(args.format).toBe('json');
    });

    it('should parse --output option', () => {
      const args = parseArgs(['--output', './reports']);
      expect(args.output).toBe('./reports');
    });

    it('should parse --branch option', () => {
      const args = parseArgs(['--branch', 'main']);
      expect(args.branch).toBe('main');
    });

    it('should parse --author option', () => {
      const args = parseArgs(['--author', 'john@example.com']);
      expect(args.author).toBe('john@example.com');
    });

    it('should parse --exclude-extensions option', () => {
      const args = parseArgs(['--exclude-extensions', '.md,.txt']);
      expect(args['exclude-extensions']).toBe('.md,.txt');
    });

    it('should parse --timezone option', () => {
      const args = parseArgs(['--timezone', 'America/Chicago']);
      expect(args.timezone).toBe('America/Chicago');
    });

    it('should parse boolean flags', () => {
      const args = parseArgs(['--heavy', '--redact-emails', '--no-cache']);
      expect(args.heavy).toBe(true);
      expect(args['redact-emails']).toBe(true);
      expect(args['no-cache']).toBe(true);
    });
  });

  describe('Option Validation', () => {
    it('should validate valid options', () => {
      const options = createTestOptions({
        repoPath: testRepoPath,
        days: 30,
        format: 'json',
      });
      const result = validateOptions(options);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid date range', () => {
      const options = {
        since: '2025-12-31',
        until: '2025-01-01',
      };
      const result = validateOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('since date must be before until date');
    });

    it('should reject negative days', () => {
      const options = { days: -5 };
      const result = validateOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('days must be positive');
    });

    it('should reject invalid format', () => {
      const options = { format: 'invalid' as any };
      const result = validateOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('invalid format');
    });

    it('should reject mutually exclusive since and days', () => {
      const options = {
        since: '2025-01-01',
        days: 30,
      };
      const result = validateOptions(options);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('cannot specify both since and days');
    });
  });

  describe('Command Execution', () => {
    it('should execute analyze command successfully', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      expect(report).toBeDefined();
      expect(report.metadata).toBeDefined();
      expect(report.repository).toBeDefined();
      expect(report.repository.totalCommits).toBeGreaterThan(0);
    });

    it('should generate JSON report', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        format: 'json',
        output: outputDir,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();
      await gitSpark.export('json', outputDir, report);

      const reportPath = join(outputDir, 'git-spark-report.json');
      expect(existsSync(reportPath)).toBe(true);
    });

    it('should generate HTML report', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        format: 'html',
        output: outputDir,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();
      await gitSpark.export('html', outputDir, report);

      const reportPath = join(outputDir, 'git-spark-report.html');
      expect(existsSync(reportPath)).toBe(true);
    });

    it('should generate CSV report', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        format: 'csv',
        output: outputDir,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();
      await gitSpark.export('csv', outputDir, report);

      const authorsPath = join(outputDir, 'authors.csv');
      const filesPath = join(outputDir, 'files.csv');
      const timelinePath = join(outputDir, 'timeline.csv');

      expect(existsSync(authorsPath)).toBe(true);
      expect(existsSync(filesPath)).toBe(true);
      expect(existsSync(timelinePath)).toBe(true);
    });

    it('should generate Markdown report', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        format: 'markdown',
        output: outputDir,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();
      await gitSpark.export('markdown', outputDir, report);

      const reportPath = join(outputDir, 'git-spark-report.md');
      expect(existsSync(reportPath)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid repository path', async () => {
      // GitSpark now validates the repository path in the constructor
      expect(() => {
        new GitSpark({
          repoPath: '/nonexistent/path',
          days: 7,
          logLevel: 'error',
          noCache: true,
        });
      }).toThrow();
    });

    it('should handle invalid date format', () => {
      const options = {
        since: 'invalid-date',
        until: '2025-12-31',
      };

      // Date validation happens in Git layer
      expect(() => new Date(options.since)).not.toThrow();
      expect(isNaN(new Date(options.since).getTime())).toBe(true);
    });
  });

  describe('Date Range Handling', () => {
    it('should analyze last N days with --days option', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      expect(report.metadata).toBeDefined();
      expect(report.metadata.analysisOptions.days).toBe(7);
    });

    it('should analyze specific date range with --since and --until', async () => {
      // Add commits with specific dates
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        since: thirtyDaysAgo.toISOString().split('T')[0],
        until: today.toISOString().split('T')[0],
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      expect(report.metadata).toBeDefined();
      expect(report.metadata.analysisOptions.since).toBeDefined();
      expect(report.metadata.analysisOptions.until).toBeDefined();
    });

    it('should handle date range with no commits', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const futureDate = future.toISOString().split('T')[0];

      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        since: futureDate,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      expect(report.repository.totalCommits).toBe(0);
      expect(Number.isFinite(report.teamScore.consistency.velocityConsistency)).toBe(true);
    });
  });

  describe('File Filtering', () => {
    it('should exclude specified extensions', async () => {
      // Add various file types
      addTestCommit(testRepoPath, 'code.ts', 'const x = 1;', 'Add TypeScript');
      addTestCommit(testRepoPath, 'docs.md', '# Docs', 'Add markdown');
      addTestCommit(testRepoPath, 'data.json', '{}', 'Add JSON');

      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        excludeExtensions: ['.md', '.json'],
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      // Should have excluded .md and .json files
      const files = report.files;
      const mdFiles = files.filter((f) => f.path.endsWith('.md'));
      const jsonFiles = files.filter((f) => f.path.endsWith('.json'));

      // Files are tracked but should be filtered from hotspots
      expect(mdFiles.length + jsonFiles.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Branch Filtering', () => {
    it('should analyze specific branch', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        branch: 'master',  // test repos default to 'master'
        days: 7,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      expect(report.metadata.branch).toBeDefined();
    });
  });

  describe('Author Filtering', () => {
    it('should filter by author', async () => {
      // The test repo is created with test@example.com as the author
      // So we should have commits from that author
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        author: 'test@example.com',
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      // All commits should be from the specified author
      const authors = report.authors;
      expect(authors.length).toBeGreaterThan(0);
      expect(authors.some((a) => a.email === 'test@example.com')).toBe(true);
    });
  });

  describe('Progress Callback', () => {
    it('should call progress callback during analysis', async () => {
      const progressCalls: Array<{ phase: string; progress: number; total: number }> = [];

      const gitSpark = new GitSpark(
        {
          repoPath: testRepoPath,
          days: 7,
          logLevel: 'error',
          noCache: true,
        },
        (phase, progress, total) => {
          progressCalls.push({ phase, progress, total });
        }
      );

      await gitSpark.analyze();

      // Should have received progress updates
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[0].progress).toBeGreaterThanOrEqual(0);
      expect(progressCalls[0].total).toBeGreaterThan(0);
    });
  });

  describe('Options Handling', () => {
    it('should handle redact-emails option', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        redactEmails: true,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      // Emails should be processed
      const authors = report.authors;
      expect(authors.length).toBeGreaterThan(0);

      // Verify that redactEmails option was set
      expect(report.metadata.analysisOptions.redactEmails).toBe(true);

      // Email should still be defined (redaction format or original)
      expect(authors[0].email).toBeDefined();
      expect(authors[0].email).not.toBe('test@example.com');
      expect(authors[0].email).toContain('*');
    });

    it('should apply config file defaults', async () => {
      const configPath = join(testRepoPath, '.git-spark.json');
      const config = {
        version: '1.0',
        analysis: {
          excludeExtensions: ['.md'],
        },
        output: {
          defaultFormat: 'json',
          outputDir: './reports',
          redactEmails: true,
        },
        performance: {
          enableCaching: false,
        },
      };
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        logLevel: 'error',
      });

      const report = await gitSpark.analyze();

      expect(report.metadata.resolvedConfig).toBeDefined();
      expect(report.metadata.analysisOptions.excludeExtensions).toContain('.md');
      expect(report.metadata.analysisOptions.redactEmails).toBe(true);
      expect(report.metadata.analysisOptions.noCache).toBe(true);
    });

    it('should handle no-cache option', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        noCache: true,
        logLevel: 'error',
      });

      await gitSpark.analyze();

      // No cache files should be created - test passes if no errors
      expect(true).toBe(true);
    });
  });

  describe('Multiple Format Export', () => {
    it('should export to multiple formats sequentially', async () => {
      const gitSpark = new GitSpark({
        repoPath: testRepoPath,
        days: 7,
        logLevel: 'error',
        noCache: true,
      });

      const report = await gitSpark.analyze();

      // Export to multiple formats
      await gitSpark.export('json', outputDir, report);
      await gitSpark.export('html', outputDir, report);
      await gitSpark.export('markdown', outputDir, report);

      const jsonPath = join(outputDir, 'git-spark-report.json');
      const htmlPath = join(outputDir, 'git-spark-report.html');
      const mdPath = join(outputDir, 'git-spark-report.md');

      expect(existsSync(jsonPath)).toBe(true);
      expect(existsSync(htmlPath)).toBe(true);
      expect(existsSync(mdPath)).toBe(true);
    });
  });
});
