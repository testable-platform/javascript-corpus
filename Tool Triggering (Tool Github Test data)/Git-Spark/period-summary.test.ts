import { summarizePeriod, bucketIntoPeriods } from '../src/core/period-summary.js';
import { CommitData } from '../src/types/index.js';

function makeCommit(overrides: Partial<CommitData> & { date: Date }): CommitData {
  return {
    hash: 'abc123',
    shortHash: 'abc',
    author: 'Alice',
    authorEmail: 'alice@example.com',
    message: 'feat: change',
    subject: 'feat: change',
    body: '',
    insertions: 10,
    deletions: 5,
    filesChanged: 1,
    isMerge: false,
    isCoAuthored: false,
    coAuthors: [],
    files: [{ path: 'src/a.ts', insertions: 10, deletions: 5, status: 'modified' }],
    ...overrides,
  };
}

describe('summarizePeriod', () => {
  it('summarizes an empty commit list', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-08');
    const summary = summarizePeriod([], start, end, 'Period 1');

    expect(summary).toEqual({
      label: 'Period 1',
      startDate: start,
      endDate: end,
      commits: 0,
      insertions: 0,
      deletions: 0,
      churn: 0,
      netLines: 0,
      filesChanged: 0,
      activeAuthors: 0,
    });
  });

  it('aggregates commits, churn, unique files, and unique authors', () => {
    const commits = [
      makeCommit({
        date: new Date('2024-01-02'),
        authorEmail: 'alice@example.com',
        insertions: 10,
        deletions: 2,
        files: [{ path: 'src/a.ts', insertions: 10, deletions: 2, status: 'modified' }],
      }),
      makeCommit({
        date: new Date('2024-01-03'),
        authorEmail: 'bob@example.com',
        insertions: 3,
        deletions: 20,
        files: [{ path: 'src/a.ts', insertions: 1, deletions: 1, status: 'modified' }],
      }),
    ];

    const summary = summarizePeriod(commits, new Date('2024-01-01'), new Date('2024-01-08'), 'Period 1');

    expect(summary.commits).toBe(2);
    expect(summary.insertions).toBe(13);
    expect(summary.deletions).toBe(22);
    expect(summary.churn).toBe(35);
    expect(summary.netLines).toBe(-9);
    expect(summary.filesChanged).toBe(1); // both commits touch src/a.ts
    expect(summary.activeAuthors).toBe(2);
  });
});

describe('bucketIntoPeriods', () => {
  const endDate = new Date('2024-01-22T00:00:00Z');

  it('creates the requested number of periods with correct boundaries', () => {
    const periods = bucketIntoPeriods([], 7, 3, endDate);

    expect(periods).toHaveLength(3);
    expect(periods[0].label).toBe('Period 1');
    expect(periods[0].startDate).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(periods[0].endDate).toEqual(new Date('2024-01-08T00:00:00Z'));
    expect(periods[1].startDate).toEqual(new Date('2024-01-08T00:00:00Z'));
    expect(periods[1].endDate).toEqual(new Date('2024-01-15T00:00:00Z'));
    expect(periods[2].startDate).toEqual(new Date('2024-01-15T00:00:00Z'));
    expect(periods[2].endDate).toEqual(endDate);
  });

  it('assigns each commit to exactly one period based on its date', () => {
    const commits = [
      makeCommit({ date: new Date('2024-01-03T00:00:00Z') }), // period 1
      makeCommit({ date: new Date('2024-01-10T00:00:00Z') }), // period 2
      makeCommit({ date: new Date('2024-01-20T00:00:00Z') }), // period 3
    ];

    const periods = bucketIntoPeriods(commits, 7, 3, endDate);

    expect(periods[0].commits).toBe(1);
    expect(periods[1].commits).toBe(1);
    expect(periods[2].commits).toBe(1);
  });

  it('treats a commit exactly on a period boundary as belonging to the later period', () => {
    const boundaryCommit = makeCommit({ date: new Date('2024-01-08T00:00:00Z') });
    const periods = bucketIntoPeriods([boundaryCommit], 7, 3, endDate);

    expect(periods[0].commits).toBe(0);
    expect(periods[1].commits).toBe(1);
  });

  it('returns zero-activity periods when there are no commits in range', () => {
    const periods = bucketIntoPeriods([], 7, 3, endDate);

    for (const period of periods) {
      expect(period.commits).toBe(0);
      expect(period.churn).toBe(0);
      expect(period.activeAuthors).toBe(0);
    }
  });
});
