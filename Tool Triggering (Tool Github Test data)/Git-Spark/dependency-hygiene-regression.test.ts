import {
  calculateConsistencyScore,
  calculateLongestStreak,
  detectVacationBreaks,
} from '../src/core/analyzer-helpers.js';
import type { CommitData } from '../src/types/index.js';

describe('Dependency Hygiene Regression', () => {
  const makeCommit = (date: string): CommitData => ({
    hash: `hash-${date}`,
    shortHash: `short-${date}`,
    author: 'Regression Tester',
    authorEmail: 'regression@example.com',
    date: new Date(date),
    message: `Commit ${date}`,
    subject: `Subject ${date}`,
    body: '',
    files: [],
    filesChanged: 0,
    insertions: 0,
    deletions: 0,
    isMerge: false,
    isCoAuthored: false,
    coAuthors: [],
  });

  it('calculates streaks deterministically after toolchain upgrades', () => {
    const commits = [
      makeCommit('2026-04-01T12:00:00Z'),
      makeCommit('2026-04-02T12:00:00Z'),
      makeCommit('2026-04-04T12:00:00Z'),
      makeCommit('2026-04-10T12:00:00Z'),
    ];

    // Apr 1→2 (1 day), 2→4 (2 days): continuous streak of 3. Apr 4→10 (6 days): breaks streak.
    expect(calculateLongestStreak(commits)).toBe(3);
  });

  it('keeps consistency score in expected range', () => {
    const commits = [
      makeCommit('2026-04-01T12:00:00Z'),
      makeCommit('2026-04-01T13:00:00Z'),
      makeCommit('2026-04-03T12:00:00Z'),
    ];

    const score = calculateConsistencyScore(commits, 5);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('detects vacation breaks of seven or more days', () => {
    const commits = [
      makeCommit('2026-04-01T12:00:00Z'),
      makeCommit('2026-04-02T12:00:00Z'),
      makeCommit('2026-04-12T12:00:00Z'),
    ];

    const breaks = detectVacationBreaks(commits);
    expect(breaks).toHaveLength(1);
    expect(breaks[0].days).toBeGreaterThanOrEqual(7);
  });
});
