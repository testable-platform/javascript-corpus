import { exportPeriodsHtml } from '../src/output/periods-html.js';
import { PeriodsReport } from '../src/types/index.js';
import { existsSync, readFileSync, rmSync } from 'fs';
import { resolve } from 'path';

describe('exportPeriodsHtml', () => {
  const testOutputDir = './test-periods-html-output';

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

  it('writes a self-contained periods-report.html file with no inline script', () => {
    exportPeriodsHtml(mockReport, testOutputDir);

    const fullPath = resolve(testOutputDir, 'periods-report.html');
    expect(existsSync(fullPath)).toBe(true);

    const content = readFileSync(fullPath, 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Period 1');
    expect(content).toContain('2024-01-15');
    expect(content).toContain('2024-01-22');
    expect(content).not.toContain('<script>');
    expect(content).toContain("script-src 'none'");
    expect(content).toContain("Content-Security-Policy");
  });

  it('escapes the repo path to prevent HTML injection', () => {
    const maliciousReport: PeriodsReport = {
      ...mockReport,
      repoPath: '<img src=x onerror=alert(1)>',
    };

    exportPeriodsHtml(maliciousReport, testOutputDir);

    const content = readFileSync(resolve(testOutputDir, 'periods-report.html'), 'utf-8');
    expect(content).not.toContain('<img src=x onerror=alert(1)>');
    expect(content).toContain('&lt;img');
  });
});
