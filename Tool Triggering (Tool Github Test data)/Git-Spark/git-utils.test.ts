import { GitExecutor } from '../src/utils/git.js';
import { GitCommand } from '../src/types/index.js';
import * as childProcess from 'child_process';
import { EventEmitter } from 'events';
import { Buffer } from 'buffer';

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

// Mock logger to avoid dependency issues
jest.mock('../src/utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }),
}));

const createMockChild = () => {
  const mockChild = new EventEmitter() as any;
  mockChild.stdout = new EventEmitter();
  mockChild.stderr = new EventEmitter();
  mockChild.kill = jest.fn();
  return mockChild;
};

describe('Git Utilities', () => {
  let gitExecutor: GitExecutor;
  let mockSpawn: jest.MockedFunction<typeof childProcess.spawn>;

  beforeEach(() => {
    gitExecutor = new GitExecutor('/test/repo');
    mockSpawn = childProcess.spawn as jest.MockedFunction<typeof childProcess.spawn>;
    jest.clearAllMocks();
  });

  describe('GitExecutor', () => {
    it('creates GitExecutor with repository path', () => {
      const executor = new GitExecutor('/custom/path');
      expect(executor).toBeInstanceOf(GitExecutor);
    });

    it('executes git command successfully', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const command: GitCommand = {
        command: 'log',
        args: ['--oneline', '-n', '5'],
      };

      const executePromise = gitExecutor.execute(command);

      // Use immediate execution for test
      mockChild.stdout.emit('data', Buffer.from('abc123 Initial commit\n'));
      mockChild.emit('close', 0);

      const result = await executePromise;
      expect(result).toBe('abc123 Initial commit\n');
      expect(mockSpawn).toHaveBeenCalledWith('git', ['log', '--oneline', '-n', '5'], {
        cwd: '/test/repo',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    });

    it('handles git command errors', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const command: GitCommand = {
        command: 'log',
        args: ['--invalid-option'],
      };

      const executePromise = gitExecutor.execute(command);

      mockChild.stderr.emit('data', Buffer.from('fatal: unrecognized option\n'));
      mockChild.emit('close', 1);

      await expect(executePromise).rejects.toThrow('Git command failed');
    });

    it('validates repository successfully', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const validatePromise = gitExecutor.validateRepository();

      mockChild.stdout.emit('data', Buffer.from('.git\n'));
      mockChild.emit('close', 0);

      const result = await validatePromise;
      expect(result).toBe(true);
    });

    it('handles repository validation failure', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const validatePromise = gitExecutor.validateRepository();

      mockChild.stderr.emit('data', Buffer.from('fatal: not a git repository\n'));
      mockChild.emit('close', 128);

      const result = await validatePromise;
      expect(result).toBe(false);
    });

    it('gets current branch', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const branchPromise = gitExecutor.getCurrentBranch();

      mockChild.stdout.emit('data', Buffer.from('main\n'));
      mockChild.emit('close', 0);

      const result = await branchPromise;
      expect(result).toBe('main');
    });

    it('gets branches and filters correctly', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const branchesPromise = gitExecutor.getBranches();

      mockChild.stdout.emit(
        'data',
        Buffer.from('origin/main\norigin/develop\norigin/HEAD -> origin/main\n')
      );
      mockChild.emit('close', 0);

      const result = await branchesPromise;
      expect(result).toEqual(['main', 'develop']);
    });

    it('gets commit count', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const countPromise = gitExecutor.getCommitCount({ since: '2024-01-01' });

      mockChild.stdout.emit('data', Buffer.from('42\n'));
      mockChild.emit('close', 0);

      const result = await countPromise;
      expect(result).toBe(42);
    });

    it('gets remote URL', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const urlPromise = gitExecutor.getRemoteUrl();

      mockChild.stdout.emit('data', Buffer.from('https://github.com/user/repo.git\n'));
      mockChild.emit('close', 0);

      const result = await urlPromise;
      expect(result).toBe('https://github.com/user/repo.git');
    });

    it('handles missing remote URL gracefully', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const urlPromise = gitExecutor.getRemoteUrl();

      mockChild.stderr.emit('data', Buffer.from('no remote configured\n'));
      mockChild.emit('close', 1);

      const result = await urlPromise;
      expect(result).toBe('');
    });

    it('gets git version', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const versionPromise = gitExecutor.getVersion();

      mockChild.stdout.emit('data', Buffer.from('git version 2.34.1\n'));
      mockChild.emit('close', 0);

      const result = await versionPromise;
      expect(result).toBe('git version 2.34.1');
    });

    it('gets file size', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const sizePromise = gitExecutor.getFileSize('src/app.ts');

      mockChild.stdout.emit('data', Buffer.from('1024\n'));
      mockChild.emit('close', 0);

      const result = await sizePromise;
      expect(result).toBe(1024);
    });

    it('handles file size error gracefully', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const sizePromise = gitExecutor.getFileSize('missing-file.ts');

      mockChild.stderr.emit('data', Buffer.from('fatal: Path does not exist\n'));
      mockChild.emit('close', 128);

      const result = await sizePromise;
      expect(result).toBe(0);
    });

    it('gets language stats with file extension mapping', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const statsPromise = gitExecutor.getLanguageStats();

      mockChild.stdout.emit(
        'data',
        Buffer.from('src/app.ts\nsrc/test.js\nREADME.md\npackage.json\ntest.unknown\n')
      );
      mockChild.emit('close', 0);

      const result = await statsPromise;
      expect(result).toEqual({
        TypeScript: 1,
        JavaScript: 1,
        Markdown: 1,
        JSON: 1,
        Other: 1,
      });
    });

    it('handles language stats error gracefully', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const statsPromise = gitExecutor.getLanguageStats();

      mockChild.stderr.emit('data', Buffer.from('error\n'));
      mockChild.emit('close', 1);

      const result = await statsPromise;
      expect(result).toEqual({});
    });

    it('gets file history with proper arguments', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const historyPromise = gitExecutor.getFileHistory('src/app.ts', 50);

      mockChild.stdout.emit('data', Buffer.from('file|history|data\n'));
      mockChild.emit('close', 0);

      const result = await historyPromise;
      expect(result).toBe('file|history|data\n');
      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        [
          'log',
          '--follow',
          '--numstat',
          '--pretty=format:%H|%h|%an|%ae|%ai|%s',
          '--max-count=50',
          '--',
          'src/app.ts',
        ],
        expect.any(Object)
      );
    });

    it('handles buffer overflow protection', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const command: GitCommand = {
        command: 'log',
        args: ['--all'],
        options: { maxBuffer: 100 },
      };

      const executePromise = gitExecutor.execute(command);

      // Emit data exceeding buffer limit
      mockChild.stdout.emit('data', Buffer.from('a'.repeat(150)));

      await expect(executePromise).rejects.toThrow('Output buffer exceeded');
      expect(mockChild.kill).toHaveBeenCalled();
    });

    it('handles spawn errors', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const command: GitCommand = {
        command: 'invalid',
        args: [],
      };

      const executePromise = gitExecutor.execute(command);

      mockChild.emit('error', new Error('Command not found'));

      await expect(executePromise).rejects.toThrow('Failed to execute git command');
    });

    it('uses custom working directory when specified', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const command: GitCommand = {
        command: 'status',
        args: ['--porcelain'],
        options: { cwd: '/custom/path' },
      };

      const executePromise = gitExecutor.execute(command);

      mockChild.emit('close', 0);

      await executePromise;

      expect(mockSpawn).toHaveBeenCalledWith('git', ['status', '--porcelain'], {
        cwd: '/custom/path',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    });

    it('gets commit log with all options', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const logPromise = gitExecutor.getCommitLog({
        since: '2024-01-01',
        until: '2024-12-31',
        author: 'john@example.com',
        maxCount: 100,
        branch: 'main',
        path: 'src/',
      });

      mockChild.stdout.emit('data', Buffer.from('commit|data|format\n'));
      mockChild.emit('close', 0);

      const result = await logPromise;
      expect(result).toBe('commit|data|format\n');
      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining([
          '--numstat',
          '--pretty=format:%H|%h|%an|%ae|%ai|%s|%b|%P',
          '--no-merges',
          '--since',
          '2024-01-01',
          '--until',
          '2024-12-31',
          '--author',
          'john@example.com',
          '--max-count',
          '100',
          'main',
          '--',
          'src/',
        ]),
        expect.any(Object)
      );
    });

    it('handles timeout properly', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const command: GitCommand = {
        command: 'log',
        args: ['--all'],
        options: { timeout: 50 },
      };

      const executePromise = gitExecutor.execute(command);

      // Don't emit close event to trigger timeout
      await expect(executePromise).rejects.toThrow('Git command timed out');
      expect(mockChild.kill).toHaveBeenCalled();
    }, 1000);

    it('gets first commit date successfully', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const datePromise = gitExecutor.getFirstCommitDate();

      mockChild.stdout.emit('data', Buffer.from('2024-01-15T10:30:45+00:00\n'));
      mockChild.emit('close', 0);

      const result = await datePromise;
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toContain('2024-01-15');
    });

    it('gets first commit date for specific branch', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      // Note: The function now ignores the branch parameter and uses --all
      // to find the repository's absolute first commit
      const datePromise = gitExecutor.getFirstCommitDate('develop');

      mockChild.stdout.emit('data', Buffer.from('2024-02-20T14:22:33+00:00\n'));
      mockChild.emit('close', 0);

      const result = await datePromise;
      expect(result).toBeInstanceOf(Date);
      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        ['log', '--all', '--reverse', '--format=%aI'],
        expect.any(Object)
      );
    });

    it('handles repository with no commits', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const datePromise = gitExecutor.getFirstCommitDate();

      mockChild.stdout.emit('data', Buffer.from(''));
      mockChild.emit('close', 0);

      const result = await datePromise;
      expect(result).toBeNull();
    });

    it('handles getFirstCommitDate error gracefully', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const datePromise = gitExecutor.getFirstCommitDate();

      mockChild.stderr.emit('data', Buffer.from('fatal: not a git repository\n'));
      mockChild.emit('close', 128);

      const result = await datePromise;
      expect(result).toBeNull();
    });
  });

  describe('isShallowRepository', () => {
    it('returns true when git reports a shallow repository', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = gitExecutor.isShallowRepository();

      mockChild.stdout.emit('data', Buffer.from('true\n'));
      mockChild.emit('close', 0);

      expect(await resultPromise).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith(
        'git',
        ['rev-parse', '--is-shallow-repository'],
        expect.any(Object)
      );
    });

    it('returns false when git reports a full repository', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = gitExecutor.isShallowRepository();

      mockChild.stdout.emit('data', Buffer.from('false\n'));
      mockChild.emit('close', 0);

      expect(await resultPromise).toBe(false);
    });

    it('returns false when the git command fails', async () => {
      const mockChild = createMockChild();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = gitExecutor.isShallowRepository();

      mockChild.stderr.emit('data', Buffer.from('fatal: not a git repository\n'));
      mockChild.emit('close', 128);

      expect(await resultPromise).toBe(false);
    });
  });
});
