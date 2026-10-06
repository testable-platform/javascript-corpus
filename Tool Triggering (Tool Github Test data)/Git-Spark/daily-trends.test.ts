import { DailyTrendsAnalyzer } from '../src/core/daily-trends.js';
import { CommitData } from '../src/types/index.js';

describe('DailyTrendsAnalyzer', () => {
  let analyzer: DailyTrendsAnalyzer;

  beforeEach(() => {
    analyzer = new DailyTrendsAnalyzer();
  });

  describe('Constructor', () => {
    it('creates analyzer with default timezone', () => {
      const defaultAnalyzer = new DailyTrendsAnalyzer();
      expect(defaultAnalyzer).toBeDefined();
    });

    it('creates analyzer with custom timezone and working hours', () => {
      const customAnalyzer = new DailyTrendsAnalyzer('UTC', {
        start: 9,
        end: 17,
        weekdays: true,
      });
      expect(customAnalyzer).toBeDefined();
    });
  });

  describe('analyzeDailyTrends', () => {
    it('returns empty trends data for empty commit array', async () => {
      const result = await analyzer.analyzeDailyTrends([]);

      expect(result).toBeDefined();
      expect(result.analysisMetadata.totalDays).toBe(0);
      expect(result.analysisMetadata.activeDays).toBe(0);
      expect(result.flowMetrics).toBeDefined();
      expect(result.stabilityMetrics).toBeDefined();
      expect(result.ownershipMetrics).toBeDefined();
      expect(result.couplingMetrics).toBeDefined();
      expect(result.hygieneMetrics).toBeDefined();
      expect(result.contributionsGraph).toBeDefined();
      expect(result.limitations).toBeDefined();
    });

    it('analyzes single commit', async () => {
      const commits: CommitData[] = [
        {
          hash: 'abc123',
          shortHash: 'abc',
          author: 'Alice',
          authorEmail: 'alice@example.com',
          date: new Date('2024-01-15T10:30:00Z'),
          message: 'feat: Add feature',
          subject: 'feat: Add feature',
          body: '',
          insertions: 100,
          deletions: 20,
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: 'src/feature.ts', insertions: 100, deletions: 20, status: 'modified' }],
        },
      ];

      const result = await analyzer.analyzeDailyTrends(commits);

      expect(result.analysisMetadata.totalDays).toBeGreaterThan(0);
      expect(result.analysisMetadata.activeDays).toBe(1);
      expect(result.analysisMetadata.timezone).toBe('America/Chicago');
    });

    it('groups commits by day correctly', async () => {
      const commits: CommitData[] = [
        {
          hash: 'abc123',
          shortHash: 'abc',
          author: 'Alice',
          authorEmail: 'alice@example.com',
          date: new Date('2024-01-15T10:00:00Z'),
          message: 'feat: First commit',
          subject: 'feat: First commit',
          body: '',
          insertions: 50,
          deletions: 10,
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: 'file1.ts', insertions: 50, deletions: 10, status: 'modified' }],
        },
        {
          hash: 'def456',
          shortHash: 'def',
          author: 'Bob',
          authorEmail: 'bob@example.com',
          date: new Date('2024-01-15T14:00:00Z'),
          message: 'fix: Second commit same day',
          subject: 'fix: Second commit same day',
          body: '',
          insertions: 30,
          deletions: 5,
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: 'file2.ts', insertions: 30, deletions: 5, status: 'modified' }],
        },
        {
          hash: 'ghi789',
          shortHash: 'ghi',
          author: 'Alice',
          authorEmail: 'alice@example.com',
          date: new Date('2024-01-16T09:00:00Z'),
          message: 'docs: Next day commit',
          subject: 'docs: Next day commit',
          body: '',
          insertions: 20,
          deletions: 2,
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: 'README.md', insertions: 20, deletions: 2, status: 'modified' }],
        },
      ];

      const result = await analyzer.analyzeDailyTrends(commits);

      expect(result.analysisMetadata.activeDays).toBe(2);
      expect(result.flowMetrics).toBeDefined();
      expect(Array.isArray(result.flowMetrics)).toBe(true);
    });

    it('handles commits with progress callback', async () => {
      const progressUpdates: Array<{ phase: string; current: number; total: number }> = [];
      const progressCallback = (phase: string, current: number, total: number) => {
        progressUpdates.push({ phase, current, total });
      };

      const commits: CommitData[] = [
        {
          hash: 'abc123',
          shortHash: 'abc',
          author: 'Alice',
          authorEmail: 'alice@example.com',
          date: new Date('2024-01-15T10:00:00Z'),
          message: 'feat: Test commit',
          subject: 'feat: Test commit',
          body: '',
          insertions: 100,
          deletions: 20,
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: 'test.ts', insertions: 100, deletions: 20, status: 'modified' }],
        },
      ];

      await analyzer.analyzeDailyTrends(commits, progressCallback);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toHaveProperty('phase');
      expect(progressUpdates[0]).toHaveProperty('current');
      expect(progressUpdates[0]).toHaveProperty('total');
    });

    it('uses analysis range when provided', async () => {
      const commits: CommitData[] = [
        {
          hash: 'abc123',
          shortHash: 'abc',
          author: 'Alice',
          authorEmail: 'alice@example.com',
          date: new Date('2024-01-15T10:00:00Z'),
          message: 'feat: Mid-month commit',
          subject: 'feat: Mid-month commit',
          body: '',
          insertions: 100,
          deletions: 20,
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: 'test.ts', insertions: 100, deletions: 20, status: 'modified' }],
        },
      ];

      const analysisRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await analyzer.analyzeDailyTrends(commits, undefined, analysisRange);

      expect(result.analysisMetadata.startDate).toEqual(analysisRange.startDate);
      expect(result.analysisMetadata.endDate).toEqual(analysisRange.endDate);
      expect(result.analysisMetadata.totalDays).toBeGreaterThan(1);
      expect(result.analysisMetadata.activeDays).toBe(1);
    });

    it('includes limitations documentation', async () => {
      const commits: CommitData[] = [
        {
          hash: 'abc123',
          shortHash: 'abc',
          author: 'Alice',
          authorEmail: 'alice@example.com',
          date: new Date('2024-01-15T10:00:00Z'),
          message: 'feat: Test',
          subject: 'feat: Test',
          body: '',
          insertions: 100,
          deletions: 20,
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: 'test.ts', insertions: 100, deletions: 20, status: 'modified' }],
        },
      ];

      const result = await analyzer.analyzeDailyTrends(commits);

      expect(result.limitations).toBeDefined();
      expect(result.limitations.dataSource).toBe('git-commit-history-only');
      expect(result.limitations.knownLimitations).toBeDefined();
      expect(Array.isArray(result.limitations.knownLimitations)).toBe(true);
      expect(result.limitations.knownLimitations.length).toBeGreaterThan(0);
    });

    it('generates contributions graph', async () => {
      const commits: CommitData[] = [
        {
          hash: 'abc123',
          shortHash: 'abc',
          author: 'Alice',
          authorEmail: 'alice@example.com',
          date: new Date('2024-01-15T10:00:00Z'),
          message: 'feat: Test commit',
          subject: 'feat: Test commit',
          body: '',
          insertions: 100,
          deletions: 20,
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: 'test.ts', insertions: 100, deletions: 20, status: 'modified' }],
        },
      ];

      const result = await analyzer.analyzeDailyTrends(commits);

      expect(result.contributionsGraph).toBeDefined();
      expect(result.contributionsGraph.weeks).toBeDefined();
      expect(Array.isArray(result.contributionsGraph.weeks)).toBe(true);
    });

    it('handles large commit dataset', async () => {
      const commits: CommitData[] = [];
      for (let i = 0; i < 50; i++) {
        commits.push({
          hash: `hash${i}`,
          shortHash: `h${i}`,
          author: i % 2 === 0 ? 'Alice' : 'Bob',
          authorEmail: i % 2 === 0 ? 'alice@example.com' : 'bob@example.com',
          date: new Date(Date.UTC(2024, 0, 1 + Math.floor(i / 3), 10, 0, 0)),
          message: `commit: Commit ${i}`,
          subject: `commit: Commit ${i}`,
          body: '',
          insertions: Math.floor(Math.random() * 100) + 10,
          deletions: Math.floor(Math.random() * 50),
          filesChanged: 1,
          isMerge: false,
          isCoAuthored: false,
          coAuthors: [],
          files: [{ path: `file${i % 10}.ts`, insertions: 10, deletions: 5, status: 'modified' }],
        });
      }

      const result = await analyzer.analyzeDailyTrends(commits);

      expect(result.analysisMetadata.activeDays).toBeGreaterThan(0);
      expect(result.analysisMetadata.totalDays).toBeGreaterThan(0);
      expect(Array.isArray(result.flowMetrics)).toBe(true);
    });
  });
});
