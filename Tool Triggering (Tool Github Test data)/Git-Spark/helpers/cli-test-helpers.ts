/**
 * Test helpers for CLI integration tests
 */

import { GitSparkOptions } from '../../src/types/index.js';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';

/**
 * Create a temporary test repository with git initialized
 */
export function createTestRepo(name: string = 'test-repo'): string {
  const uniqueName = `${name}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpDir = join(process.cwd(), 'test-tmp', uniqueName);

  // Clean up if exists
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }

  // Create directory
  mkdirSync(tmpDir, { recursive: true });

  // Initialize git
  execSync('git init', { cwd: tmpDir });
  execSync('git config user.name "Test User"', { cwd: tmpDir });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir });

  // Create initial commit
  writeFileSync(join(tmpDir, 'README.md'), '# Test Repository\n');
  execSync('git add .', { cwd: tmpDir });
  // Explicitly set author to ensure consistent test behavior across different environments
  execSync('git commit --author="Test User <test@example.com>" -m "Initial commit"', { cwd: tmpDir });

  return tmpDir;
}

/**
 * Clean up a test repository
 */
export function cleanupTestRepo(repoPath: string): void {
  if (existsSync(repoPath)) {
    rmSync(repoPath, { recursive: true, force: true });
  }
}

/**
 * Create test options with defaults
 */
export function createTestOptions(overrides?: Partial<GitSparkOptions>): GitSparkOptions {
  return {
    repoPath: process.cwd(),
    days: 30,
    format: 'json',
    output: './test-output',
    logLevel: 'error',
    noCache: true,
    ...overrides,
  };
}

/**
 * Add a test commit to a repository
 */
export function addTestCommit(
  repoPath: string,
  fileName: string,
  content: string,
  message: string
): void {
  const filePath = join(repoPath, fileName);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
  execSync(`git add "${fileName}"`, { cwd: repoPath });
  // Explicitly set author to ensure consistent test behavior across different environments
  execSync(`git commit --author="Test User <test@example.com>" -m "${message}"`, { cwd: repoPath });
}

/**
 * Create multiple test commits
 */
export function createTestCommits(repoPath: string, count: number): void {
  for (let i = 1; i <= count; i++) {
    addTestCommit(
      repoPath,
      `file${i}.txt`,
      `Content ${i}\n`,
      `Commit ${i}`
    );
  }
}

/**
 * Mock progress callback for testing
 */
export function createMockProgress(): (progress: number, message: string) => void {
  const calls: Array<{ progress: number; message: string }> = [];

  const callback = (progress: number, message: string) => {
    calls.push({ progress, message });
  };

  (callback as any).getCalls = () => calls;

  return callback;
}

/**
 * Validate GitSpark options
 */
export function validateOptions(options: Partial<GitSparkOptions>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate date range
  if (options.since && options.until) {
    const since = new Date(options.since);
    const until = new Date(options.until);
    if (since > until) {
      errors.push('since date must be before until date');
    }
  }

  // Validate days
  if (options.days !== undefined && options.days < 1) {
    errors.push('days must be positive');
  }

  // Validate format
  if (options.format && !['html', 'json', 'csv', 'markdown', 'console'].includes(options.format)) {
    errors.push(`invalid format: ${options.format}`);
  }

  // Validate mutually exclusive options
  if (options.since && options.days) {
    errors.push('cannot specify both since and days');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse command line arguments (simplified for testing)
 */
export function parseArgs(args: string[]): Record<string, any> {
  const parsed: Record<string, any> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('--')) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }

  return parsed;
}

/**
 * Capture console output during function execution
 */
export async function captureOutput(
  fn: () => Promise<void>
): Promise<{ stdout: string; stderr: string }> {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  let stdout = '';
  let stderr = '';

  console.log = (...args: any[]) => {
    stdout += args.join(' ') + '\n';
  };

  console.error = (...args: any[]) => {
    stderr += args.join(' ') + '\n';
  };

  console.warn = (...args: any[]) => {
    stderr += args.join(' ') + '\n';
  };

  try {
    await fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }

  return { stdout, stderr };
}
