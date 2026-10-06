import { exportPeriodsMarkdown } from '../src/output/periods-markdown.js';
import { PeriodsReport } from '../src/types/index.js';
import { existsSync, readFileSync, rmSync } from 'fs';
import { resolve } from 'path';

describe('exportPeriodsMarkdown', () => {
  const testOutputDir = './test-periods-markdown-output';

  const mockReport: PeriodsReport = {
    repoPath: '/test/repo',
    periodDays: 7,
    periodCount: 1,
    generatedAt: new Date('2024-01-22T00:00:00Z'),
    periods: [
      {
        label: 'Period 1',
        startDate: new Date('2024-01-15T00:00:00Z'),
        endDate: new Date('2024-01-22T00:00:00Z'),
        commits: 5,
        insertions: 100,
        deletions: 20,
        churn: 120,
        netLines: 80,
        filesChanged: 3,
        activeAuthors: 2,
      },
    ],
  };

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it('writes a periods-report.md file with a table row per period', () => {
    exportPeriodsMarkdown(mockReport, testOutputDir);

    const fullPath = resolve(testOutputDir, 'periods-report.md');
    expect(existsSync(fullPath)).toBe(true);

    const content = readFileSync(fullPath, 'utf-8');
    expect(content).toContain('Period 1');
    expect(content).toContain('2024-01-15');
    expect(content).toContain('2024-01-22');
    expect(content).toContain('120');
    expect(content).toContain('+80');
    expect(content).toContain('/test/repo');
  });
});
