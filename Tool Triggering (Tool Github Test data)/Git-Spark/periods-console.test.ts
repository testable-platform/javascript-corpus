import { renderPeriodsConsole } from '../src/output/periods-console.js';
import { PeriodsReport } from '../src/types/index.js';

describe('renderPeriodsConsole', () => {
  const mockReport: PeriodsReport = {
    repoPath: '/test/repo',
    periodDays: 7,
    periodCount: 2,
    generatedAt: new Date('2024-01-22T00:00:00Z'),
    periods: [
      {
        label: 'Period 1',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-08T00:00:00Z'),
        commits: 5,
        insertions: 100,
        deletions: 20,
        churn: 120,
        netLines: 80,
        filesChanged: 3,
        activeAuthors: 2,
      },
      {
        label: 'Period 2',
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-15T00:00:00Z'),
        commits: 1,
        insertions: 0,
        deletions: 40,
        churn: 40,
        netLines: -40,
        filesChanged: 1,
        activeAuthors: 1,
      },
    ],
  };

  it('prints a table with a row per period and correct values', () => {
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    renderPeriodsConsole(mockReport);

    const output = writeSpy.mock.calls.map(call => call[0]).join('');
    expect(output).toContain('Period 1');
    expect(output).toContain('Period 2');
    expect(output).toContain('2024-01-01');
    expect(output).toContain('2024-01-08');
    expect(output).toContain('120'); // churn for period 1
    expect(output).toContain('+80'); // net lines for period 1
    expect(output).toContain('-40'); // net lines for period 2

    writeSpy.mockRestore();
  });
});
