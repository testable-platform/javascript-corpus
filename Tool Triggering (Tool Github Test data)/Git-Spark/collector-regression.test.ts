import { DataCollector } from '../src/core/collector.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

// Helper to init a lightweight git repo for parsing tests
function initRepo(root: string) {
  execSync('git init', { cwd: root });
  execSync('git config user.name "Test User"', { cwd: root });
  execSync('git config user.email "test@example.com"', { cwd: root });
}

function commit(root: string, msg: string, file: string, content: string) {
  const fullPath = join(root, file);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  execSync(`git add ${file}`, { cwd: root });
  // Support multi-line commit messages safely via temp file
  const msgFile = join(root, '.git', 'TMP_COMMIT_MSG');
  writeFileSync(msgFile, msg, 'utf-8');
  execSync(`git commit -F "${msgFile}"`, { cwd: root });
}

describe('DataCollector streaming parser regression', () => {
  const tmp = join(process.cwd(), 'tmp-regression-repo');

  beforeAll(() => {
    mkdirSync(tmp, { recursive: true });
    initRepo(tmp);
    // Commit with multi-line body that previously caused header truncation
    commit(
      tmp,
      'feat: first commit\n\n- line one of body\n- line two of body with details',
      'file1.txt',
      'alpha'
    );
    // Second commit larger to produce multiple numstat lines
    commit(
      tmp,
      'chore: second commit with more changes',
      'dir/file2.txt',
      'beta content\nmore lines\neven more lines'
    );
    commit(tmp, 'refactor: third commit touching multiple files', 'dir/file3.txt', 'third file');
  });

  afterAll(() => {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('parses multiple commits via streaming parser', async () => {
    const collector = new DataCollector(tmp);
    const commits = await collector.collectCommits({ repoPath: tmp });
    expect(commits.length).toBeGreaterThanOrEqual(2);
    // Ensure subjects are captured and not empty
    expect(commits.every(c => c.subject.length > 0)).toBe(true);
  });

  it('extracts file stats for each commit correctly', async () => {
    const collector = new DataCollector(tmp);
    const commits = await collector.collectCommits({ repoPath: tmp });
    const withMultiple = commits.find(c => c.subject.startsWith('chore: second'));
    expect(withMultiple).toBeTruthy();
    expect(withMultiple?.files.length).toBeGreaterThanOrEqual(1);
    // Ensure totals computed
    if (withMultiple) {
      expect(withMultiple.insertions + withMultiple.deletions).toBeGreaterThan(0);
    } else {
      fail('Expected to find second commit');
    }
  });
});
