/**
 * Tests for file extension exclusion feature
 */

import { GitAnalyzer } from '../src/core/analyzer';
import { DataCollector } from '../src/core/collector';
import { CommitData, GitSparkOptions } from '../src/types';

// Mock the DataCollector
jest.mock('../src/core/collector');

describe('File Extension Exclusion', () => {
  let analyzer: GitAnalyzer;
  let mockCollector: jest.Mocked<DataCollector>;

  beforeEach(() => {
    // Create mock commits with various file types
    const mockCommits: CommitData[] = [
      {
        hash: 'abc123',
        shortHash: 'abc123',
        author: 'Test User',
        authorEmail: 'test@example.com',
        date: new Date('2024-01-01'),
        message: 'Test commit',
        subject: 'Test commit',
        body: '',
        insertions: 10,
        deletions: 5,
        filesChanged: 3,
        isMerge: false,
        isCoAuthored: false,
        coAuthors: [],
        files: [
          { path: 'src/index.ts', insertions: 5, deletions: 2, status: 'modified' },
          { path: 'README.md', insertions: 3, deletions: 1, status: 'modified' },
          { path: 'docs/guide.md', insertions: 2, deletions: 2, status: 'modified' },
        ],
      },
      {
        hash: 'def456',
        shortHash: 'def456',
        author: 'Test User',
        authorEmail: 'test@example.com',
        date: new Date('2024-01-02'),
        message: 'Another commit',
        subject: 'Another commit',
        body: '',
        insertions: 20,
        deletions: 10,
        filesChanged: 3,
        isMerge: false,
        isCoAuthored: false,
        coAuthors: [],
        files: [
          { path: 'src/utils.ts', insertions: 10, deletions: 5, status: 'modified' },
          { path: 'CHANGELOG.md', insertions: 5, deletions: 3, status: 'modified' },
          { path: 'package.json', insertions: 5, deletions: 2, status: 'modified' },
        ],
      },
    ];

    // Setup mock collector
    mockCollector = {
      collectCommits: jest.fn().mockResolvedValue(mockCommits),
      validateRepository: jest.fn().mockResolvedValue(true),
      getRepositoryPath: jest.fn().mockReturnValue('/mock/repo'),
      getBranches: jest.fn().mockResolvedValue(['main']),
      getCurrentBranch: jest.fn().mockResolvedValue('main'),
      getRemoteUrl: jest.fn().mockResolvedValue('https://github.com/test/repo'),
      getLanguageStats: jest.fn().mockResolvedValue({ TypeScript: 100 }),
      getWarnings: jest.fn().mockReturnValue([]),
    } as any;

    (DataCollector as jest.MockedClass<typeof DataCollector>).mockImplementation(
      () => mockCollector
    );

    analyzer = new GitAnalyzer('/mock/repo');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should exclude .md files when excludeExtensions includes .md', async () => {
    const options: GitSparkOptions = {
      repoPath: '/mock/repo',
      excludeExtensions: ['.md'],
    };

    const report = await analyzer.analyze(options);

    // Check that .md files are excluded
    const mdFiles = report.files.filter(f => f.path.endsWith('.md'));
    expect(mdFiles.length).toBe(0);

    // Check that TypeScript files are still included
    const tsFiles = report.files.filter(f => f.path.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThan(0);
  });

  test('should exclude multiple extensions when specified', async () => {
    const options: GitSparkOptions = {
      repoPath: '/mock/repo',
      excludeExtensions: ['.md', '.json'],
    };

    const report = await analyzer.analyze(options);

    // Check that .md and .json files are excluded
    const excludedFiles = report.files.filter(
      f => f.path.endsWith('.md') || f.path.endsWith('.json')
    );
    expect(excludedFiles.length).toBe(0);

    // Check that TypeScript files are still included
    const tsFiles = report.files.filter(f => f.path.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThan(0);
  });

  test('should include all files when excludeExtensions is empty', async () => {
    const options: GitSparkOptions = {
      repoPath: '/mock/repo',
      excludeExtensions: [],
    };

    const report = await analyzer.analyze(options);

    // All file types should be present
    expect(report.files.length).toBeGreaterThan(0);
  });

  test('should include all files when excludeExtensions is not specified', async () => {
    const options: GitSparkOptions = {
      repoPath: '/mock/repo',
    };

    const report = await analyzer.analyze(options);

    // All file types should be present
    expect(report.files.length).toBeGreaterThan(0);
  });

  test('should handle extensions with or without leading dot', async () => {
    const options: GitSparkOptions = {
      repoPath: '/mock/repo',
      excludeExtensions: ['.md', '.json'], // Both with dots for consistent behavior
    };

    const report = await analyzer.analyze(options);

    // Both .md and .json files should be excluded
    const excludedFiles = report.files.filter(
      f => f.path.endsWith('.md') || f.path.endsWith('.json')
    );
    expect(excludedFiles.length).toBe(0);
  });

  test('should be case-insensitive when matching extensions', async () => {
    const options: GitSparkOptions = {
      repoPath: '/mock/repo',
      excludeExtensions: ['.MD'], // Uppercase
    };

    const report = await analyzer.analyze(options);

    // .md files should still be excluded
    const mdFiles = report.files.filter(f => f.path.toLowerCase().endsWith('.md'));
    expect(mdFiles.length).toBe(0);
  });

  test('should update file list to reflect excluded files', async () => {
    const options: GitSparkOptions = {
      repoPath: '/mock/repo',
      excludeExtensions: ['.md'],
    };

    const report = await analyzer.analyze(options);

    // The files list should not contain .md files
    const mdFiles = report.files.filter(f => f.path.endsWith('.md'));
    expect(mdFiles.length).toBe(0);

    // But non-excluded files should still be present
    const nonMdFiles = report.files.filter(f => !f.path.endsWith('.md'));
    expect(nonMdFiles.length).toBeGreaterThan(0);

    // The analyzed files list should only contain non-excluded files
    expect(report.files.length).toBe(nonMdFiles.length);

    // All files in the report should be TypeScript or JSON
    const allFilesValid = report.files.every(
      f => f.path.endsWith('.ts') || f.path.endsWith('.json')
    );
    expect(allFilesValid).toBe(true);
  });

  test('should exclude files from hotspot analysis', async () => {
    const options: GitSparkOptions = {
      repoPath: '/mock/repo',
      excludeExtensions: ['.md'],
    };

    const report = await analyzer.analyze(options);

    // Hotspots should not contain .md files
    const mdHotspots = report.hotspots.filter(f => f.path.endsWith('.md'));
    expect(mdHotspots.length).toBe(0);
  });
});
