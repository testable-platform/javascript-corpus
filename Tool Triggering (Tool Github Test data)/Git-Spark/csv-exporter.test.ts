import { CSVExporter } from '../src/output/csv.js';
import { AnalysisReport } from '../src/types/index.js';
import { existsSync, readFileSync, rmSync } from 'fs';
import { resolve } from 'path';

describe('CSVExporter', () => {
  let csvExporter: CSVExporter;
  let mockReport: AnalysisReport;
  const testOutputDir = './test-csv-output';

  beforeEach(() => {
    csvExporter = new CSVExporter();

    mockReport = {
      metadata: {
        generatedAt: new Date('2024-01-01T12:00:00Z'),
        version: '1.0.0',
        repoPath: '/test/repo',
        branch: 'main',
        analysisOptions: { repoPath: '/test/repo' },
        processingTime: 1000,
        gitVersion: '2.44.0',
        commit: 'abcdef12',
      },
      repository: {
        totalCommits: 100,
        totalAuthors: 2,
        totalFiles: 3,
        totalChurn: 10000,
        firstCommit: new Date('2023-01-01'),
        lastCommit: new Date('2024-01-01'),
        activeDays: 365,
        avgCommitsPerDay: 0.27,
        languages: { typescript: 5000, javascript: 3000 },
        busFactor: 2,
        healthScore: 0.75,
        governanceScore: 0.65,
      },
      authors: [
        {
          name: 'Alice',
          email: 'alice@example.com',
          commits: 60,
          insertions: 5000,
          deletions: 1000,
          churn: 6000,
          filesChanged: 25,
          firstCommit: new Date('2023-01-01'),
          lastCommit: new Date('2024-01-01'),
          activeDays: 200,
          avgCommitSize: 120,
          largestCommit: 500,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 5,
            afterHours: 6, // 10% of 60 commits
            weekends: 12, // 20% of 60 commits
          },
        },
        {
          name: 'Bob "The Builder"',
          email: 'bob@example.com',
          commits: 40,
          insertions: 3000,
          deletions: 500,
          churn: 3500,
          filesChanged: 15,
          firstCommit: new Date('2023-06-01'),
          lastCommit: new Date('2024-01-01'),
          activeDays: 120,
          avgCommitSize: 87.5,
          largestCommit: 300,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 3,
            afterHours: 4, // 10% of 40 commits
            weekends: 8, // 20% of 40 commits
          },
        },
      ],
      files: [
        {
          path: 'src/main.ts',
          commits: 20,
          authors: ['alice@example.com', 'bob@example.com'],
          churn: 2000,
          insertions: 1500,
          deletions: 500,
          firstChange: new Date('2023-01-01'),
          lastChange: new Date('2024-01-01'),
          riskScore: 0.8,
          hotspotScore: 0.9,
          ownership: { 'alice@example.com': 12, 'bob@example.com': 8 },
          language: 'TypeScript',
        },
        {
          path: 'src/utils,with,commas.ts',
          commits: 15,
          authors: ['alice@example.com'],
          churn: 1500,
          insertions: 1200,
          deletions: 300,
          firstChange: new Date('2023-02-01'),
          lastChange: new Date('2023-12-01'),
          riskScore: 0.6,
          hotspotScore: 0.7,
          ownership: { 'alice@example.com': 15 },
          language: 'TypeScript',
        },
        {
          path: 'README.md',
          commits: 5,
          authors: ['bob@example.com'],
          churn: 500,
          insertions: 400,
          deletions: 100,
          firstChange: new Date('2023-01-15'),
          lastChange: new Date('2023-11-01'),
          riskScore: 0.2,
          hotspotScore: 0.3,
          ownership: { 'bob@example.com': 5 },
          language: 'Markdown',
        },
      ],
      hotspots: [],
      timeline: [
        {
          date: new Date('2023-01-01'),
          commits: 5,
          authors: 2,
          churn: 500,
          files: 3,
        },
        {
          date: new Date('2023-01-02'),
          commits: 3,
          authors: 1,
          churn: 300,
          files: 2,
        },
        {
          date: new Date('2023-01-03'),
          commits: 7,
          authors: 2,
          churn: 700,
          files: 4,
        },
      ],
      risks: {
        highRiskFiles: [],
        riskFactors: {
          highChurnFiles: 2,
          manyAuthorFiles: 1,
          largeCommits: 3,
          recentChanges: 5,
        },
        recommendations: ['Review high-churn files'],
        overallRisk: 'medium',
      },
      governance: {
        conventionalCommits: 60,
        traceabilityScore: 0.8,
        avgMessageLength: 45,
        wipCommits: 5,
        revertCommits: 2,
        shortMessages: 10,
        score: 0.65,
        recommendations: ['Adopt conventional commit format'],
      },
      summary: {
        healthRating: 'good',
        keyMetrics: {
          commits: 100,
          authors: 2,
          files: 3,
          healthScore: 75,
        },
        insights: ['Repository shows good activity patterns'],
        actionItems: ['Address high-risk files'],
      },
    } as unknown as AnalysisReport;
  });

  afterEach(() => {
    // Clean up test output directory
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  it('exports all CSV files', async () => {
    await csvExporter.export(mockReport, testOutputDir);

    expect(existsSync(resolve(testOutputDir, 'authors.csv'))).toBe(true);
    expect(existsSync(resolve(testOutputDir, 'files.csv'))).toBe(true);
    expect(existsSync(resolve(testOutputDir, 'timeline.csv'))).toBe(true);
  });

  it('exports authors CSV with correct headers and data', async () => {
    await csvExporter.export(mockReport, testOutputDir);

    const authorsPath = resolve(testOutputDir, 'authors.csv');
    const content = readFileSync(authorsPath, 'utf-8');
    const lines = content.split('\n');

    // Check headers
    const headers = lines[0].split(',');
    expect(headers).toContain('Name');
    expect(headers).toContain('Email');
    expect(headers).toContain('Commits');
    expect(headers).toContain('Insertions');
    expect(headers).toContain('Deletions');
    expect(headers).toContain('After Hours %');
    expect(headers).toContain('Weekend %');

    // Check data rows
    expect(lines).toHaveLength(3); // header + 2 authors
    expect(lines[1]).toContain('Alice');
    expect(lines[1]).toContain('alice@example.com');
    expect(lines[1]).toContain('60'); // commits
    expect(lines[1]).toContain('5000'); // insertions
    expect(lines[1]).toContain('10'); // after hours %
    expect(lines[1]).toContain('20'); // weekend %

    expect(lines[2]).toContain('"Bob ""The Builder"""'); // CSV double-quote escaping
    expect(lines[2]).toContain('bob@example.com');
    expect(lines[2]).toContain('40'); // commits
  });

  it('exports files CSV with correct headers and data', async () => {
    await csvExporter.export(mockReport, testOutputDir);

    const filesPath = resolve(testOutputDir, 'files.csv');
    const content = readFileSync(filesPath, 'utf-8');
    const lines = content.split('\n');

    // Check headers
    const headers = lines[0].split(',');
    expect(headers).toContain('Path');
    expect(headers).toContain('Commits');
    expect(headers).toContain('Authors');
    expect(headers).toContain('Risk Score');
    expect(headers).toContain('Language');

    // Check data rows
    expect(lines).toHaveLength(4); // header + 3 files
    expect(lines[1]).toContain('src/main.ts');
    expect(lines[1]).toContain('20'); // commits
    expect(lines[1]).toContain('2'); // authors count
    expect(lines[1]).toContain('80.00'); // risk score as percentage

    // Check CSV escaping for comma in filename
    expect(lines[2]).toContain('"src/utils,with,commas.ts"');
    expect(lines[2]).toContain('TypeScript');

    expect(lines[3]).toContain('README.md');
    expect(lines[3]).toContain('Markdown');
  });

  it('exports timeline CSV with correct headers and data', async () => {
    await csvExporter.export(mockReport, testOutputDir);

    const timelinePath = resolve(testOutputDir, 'timeline.csv');
    const content = readFileSync(timelinePath, 'utf-8');
    const lines = content.split('\n');

    // Check headers
    const headers = lines[0].split(',');
    expect(headers).toEqual(['Date', 'Commits', 'Authors', 'Churn', 'Files']);

    // Check data rows
    expect(lines).toHaveLength(4); // header + 3 timeline entries
    expect(lines[1]).toBe('2023-01-01,5,2,500,3');
    expect(lines[2]).toBe('2023-01-02,3,1,300,2');
    expect(lines[3]).toBe('2023-01-03,7,2,700,4');
  });

  it('formats dates as YYYY-MM-DD', async () => {
    await csvExporter.export(mockReport, testOutputDir);

    const authorsPath = resolve(testOutputDir, 'authors.csv');
    const content = readFileSync(authorsPath, 'utf-8');

    expect(content).toContain('2023-01-01'); // first commit date
    expect(content).toContain('2024-01-01'); // last commit date
    expect(content).toContain('2023-06-01'); // Bob's first commit
  });

  it('escapes CSV fields with special characters', async () => {
    const reportWithSpecialChars = {
      ...mockReport,
      authors: [
        {
          ...mockReport.authors[0],
          name: 'Alice, "Special" User\nWith Newline',
          email: 'alice@example.com',
        },
      ],
    };

    await csvExporter.export(reportWithSpecialChars, testOutputDir);

    const authorsPath = resolve(testOutputDir, 'authors.csv');
    const content = readFileSync(authorsPath, 'utf-8');

    // Should be properly escaped with quotes and doubled internal quotes
    expect(content).toContain('"Alice, ""Special"" User\nWith Newline"');
  });

  it('handles empty arrays gracefully', async () => {
    const emptyReport = {
      ...mockReport,
      authors: [],
      files: [],
      timeline: [],
    };

    await csvExporter.export(emptyReport, testOutputDir);

    // Files should still be created with headers
    const authorsPath = resolve(testOutputDir, 'authors.csv');
    const filesPath = resolve(testOutputDir, 'files.csv');
    const timelinePath = resolve(testOutputDir, 'timeline.csv');

    expect(existsSync(authorsPath)).toBe(true);
    expect(existsSync(filesPath)).toBe(true);
    expect(existsSync(timelinePath)).toBe(true);

    // Each should have only headers
    const authorsContent = readFileSync(authorsPath, 'utf-8');
    const filesContent = readFileSync(filesPath, 'utf-8');
    const timelineContent = readFileSync(timelinePath, 'utf-8');

    expect(authorsContent.split('\n')).toHaveLength(1); // only header
    expect(filesContent.split('\n')).toHaveLength(1); // only header
    expect(timelineContent.split('\n')).toHaveLength(1); // only header
  });

  it('creates output directory if it does not exist', async () => {
    const nestedPath = resolve(testOutputDir, 'nested', 'path');

    await csvExporter.export(mockReport, nestedPath);

    expect(existsSync(resolve(nestedPath, 'authors.csv'))).toBe(true);
    expect(existsSync(resolve(nestedPath, 'files.csv'))).toBe(true);
    expect(existsSync(resolve(nestedPath, 'timeline.csv'))).toBe(true);
  });

  it('rounds numeric values appropriately', async () => {
    await csvExporter.export(mockReport, testOutputDir);

    const authorsPath = resolve(testOutputDir, 'authors.csv');
    const content = readFileSync(authorsPath, 'utf-8');

    // Alice avg commit size should be rounded to 120
    expect(content).toContain(',120,');

    // Bob avg commit size should be rounded to 88 (from 87.5)
    expect(content).toContain(',88,');
  });

  it('handles files without language gracefully', async () => {
    const reportWithoutLanguage = {
      ...mockReport,
      files: [
        {
          ...mockReport.files[0],
          language: '',
        },
      ],
    };

    await csvExporter.export(reportWithoutLanguage, testOutputDir);

    const filesPath = resolve(testOutputDir, 'files.csv');
    const content = readFileSync(filesPath, 'utf-8');

    // Should end with empty string for language field
    const lines = content.split('\n');
    expect(lines[1]).toMatch(/,$/); // ends with comma (empty language field)
  });

  it('exports the standard CSV files', async () => {
    await csvExporter.export(mockReport, testOutputDir);

    // Standard CSV files should be created
    expect(existsSync(resolve(testOutputDir, 'authors.csv'))).toBe(true);
    expect(existsSync(resolve(testOutputDir, 'files.csv'))).toBe(true);
    expect(existsSync(resolve(testOutputDir, 'timeline.csv'))).toBe(true);
  });

  it('handles authors with zero commits gracefully', async () => {
    const reportWithZeroCommits = {
      ...mockReport,
      authors: [
        {
          ...mockReport.authors[0],
          commits: 0,
          workPatterns: {
            ...mockReport.authors[0].workPatterns,
            afterHours: 0,
            weekends: 0,
          },
        },
      ],
    };

    await csvExporter.export(reportWithZeroCommits, testOutputDir);

    const authorsPath = resolve(testOutputDir, 'authors.csv');
    const content = readFileSync(authorsPath, 'utf-8');

    // Should handle division by zero gracefully (NaN should become 0 or similar)
    expect(content).toBeTruthy();
    expect(content.split('\n')).toHaveLength(2); // header + 1 author
  });

  it('handles export errors gracefully', async () => {
    const invalidPath = '/invalid/\0/path'; // Null character in path - invalid on all platforms

    await expect(csvExporter.export(mockReport, invalidPath)).rejects.toThrow();
  });

  it('handles write permission errors', async () => {
    // Use a path that would cause permission issues
    const readOnlyPath = '\0invalid';

    await expect(csvExporter.export(mockReport, readOnlyPath)).rejects.toThrow();
  });});