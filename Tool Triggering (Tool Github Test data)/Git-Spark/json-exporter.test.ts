import { JSONExporter } from '../src/output/json.js';
import { AnalysisReport } from '../src/types/index.js';
import { existsSync, readFileSync, rmSync } from 'fs';
import { resolve } from 'path';

describe('JSONExporter', () => {
  let jsonExporter: JSONExporter;
  let mockReport: AnalysisReport;
  const testOutputDir = './test-json-output';

  beforeEach(() => {
    jsonExporter = new JSONExporter();

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
        totalAuthors: 5,
        totalFiles: 50,
        totalChurn: 10000,
        firstCommit: new Date('2024-01-01'),
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
          commits: 50,
          insertions: 5000,
          deletions: 1000,
          churn: 6000,
          filesChanged: 25,
          firstCommit: new Date('2024-01-01'),
          lastCommit: new Date('2024-01-01'),
          activeDays: 200,
          avgCommitSize: 120,
          largestCommit: 500,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 5,
            afterHours: 10,
            weekends: 15,
          },
        },
      ],
      files: [
        {
          path: 'src/main.ts',
          commits: 20,
          authors: ['alice@example.com'],
          churn: 2000,
          insertions: 1500,
          deletions: 500,
          firstChange: new Date('2024-01-01'),
          lastChange: new Date('2024-01-01'),
          riskScore: 0.8,
          hotspotScore: 0.9,
          ownership: { 'alice@example.com': 20 },
          language: 'TypeScript',
        },
      ],
      hotspots: [],
      timeline: [],
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
          authors: 5,
          files: 50,
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

  it('exports valid JSON file', async () => {
    await jsonExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    expect(existsSync(outputPath)).toBe(true);

    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    expect(parsedData).toHaveProperty('metadata');
    expect(parsedData).toHaveProperty('repository');
    expect(parsedData).toHaveProperty('authors');
    expect(parsedData).toHaveProperty('files');
    expect(parsedData).toHaveProperty('risks');
    expect(parsedData).toHaveProperty('governance');
    expect(parsedData).toHaveProperty('summary');
  });

  it('formats JSON with proper indentation', async () => {
    await jsonExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');

    // Check for 2-space indentation
    expect(jsonContent).toContain('  "metadata":');
    expect(jsonContent).toContain('    "generatedAt":');
  });

  it('serializes dates as ISO strings', async () => {
    await jsonExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    expect(parsedData.metadata.generatedAt).toBe('2024-01-01T12:00:00.000Z');
    expect(parsedData.repository.firstCommit).toBe('2024-01-01T00:00:00.000Z');
    expect(parsedData.repository.lastCommit).toBe('2024-01-01T00:00:00.000Z');
  });

  it('preserves all report data accurately', async () => {
    await jsonExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    // Check metadata
    expect(parsedData.metadata.version).toBe('1.0.0');
    expect(parsedData.metadata.repoPath).toBe('/test/repo');
    expect(parsedData.metadata.processingTime).toBe(1000);

    // Check repository data
    expect(parsedData.repository.totalCommits).toBe(100);
    expect(parsedData.repository.totalAuthors).toBe(5);
    expect(parsedData.repository.healthScore).toBe(0.75);

    // Check authors data
    expect(parsedData.authors).toHaveLength(1);
    expect(parsedData.authors[0].name).toBe('Alice');
    expect(parsedData.authors[0].commits).toBe(50);

    // Check files data
    expect(parsedData.files).toHaveLength(1);
    expect(parsedData.files[0].path).toBe('src/main.ts');
    expect(parsedData.files[0].riskScore).toBe(0.8);
  });

  it('handles Map objects by converting to plain objects', async () => {
    const reportWithMap = {
      ...mockReport,
      files: [
        {
          ...mockReport.files[0],
          ownership: new Map([
            ['alice@example.com', 20],
            ['bob@example.com', 5],
          ]) as any, // Cast to any to test the serialization
        },
      ],
    } as any; // Cast entire report to test Map handling

    await jsonExporter.export(reportWithMap, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    expect(parsedData.files[0].ownership).toEqual({
      'alice@example.com': 20,
      'bob@example.com': 5,
    });
  });

  it('handles Set objects by converting to arrays', async () => {
    const reportWithSet = {
      ...mockReport,
      authors: [
        {
          ...mockReport.authors[0],
          skills: new Set(['typescript', 'react', 'node']) as any, // Cast to test Set handling
        },
      ],
    } as any; // Cast entire report to test Set handling

    await jsonExporter.export(reportWithSet, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    expect(parsedData.authors[0].skills).toEqual(['typescript', 'react', 'node']);
  });

  it('creates output directory if it does not exist', async () => {
    const nestedPath = resolve(testOutputDir, 'nested', 'path');

    await jsonExporter.export(mockReport, nestedPath);

    const outputPath = resolve(nestedPath, 'git-spark-report.json');
    expect(existsSync(outputPath)).toBe(true);
  });

  it('creates directories for non-existent path', async () => {
    // The exporter creates directories recursively, so this should succeed
    // Use a path within the project directory to avoid permission issues
    const invalidPath = './test-json-output/deeply/nested/path/that/should/not/exist';

    await expect(jsonExporter.export(mockReport, invalidPath)).resolves.not.toThrow();
  });

  it('handles empty arrays and objects', async () => {
    const minimalReport = {
      ...mockReport,
      authors: [],
      files: [],
      hotspots: [],
      timeline: [],
      risks: {
        ...mockReport.risks,
        highRiskFiles: [],
        recommendations: [],
      },
      governance: {
        ...mockReport.governance,
        recommendations: [],
      },
      summary: {
        ...mockReport.summary,
        insights: [],
        actionItems: [],
      },
    };

    await jsonExporter.export(minimalReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    expect(parsedData.authors).toEqual([]);
    expect(parsedData.files).toEqual([]);
    expect(parsedData.risks.recommendations).toEqual([]);
  });

  it('preserves numerical precision', async () => {
    const reportWithPreciseNumbers = {
      ...mockReport,
      repository: {
        ...mockReport.repository,
        healthScore: 0.7532891,
        avgCommitsPerDay: 2.3456789,
      },
    };

    await jsonExporter.export(reportWithPreciseNumbers, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    expect(parsedData.repository.healthScore).toBe(0.7532891);
    expect(parsedData.repository.avgCommitsPerDay).toBe(2.3456789);
  });

  it('handles file system errors gracefully', async () => {
    const invalidPath = '\0invalid'; // Null character in path - invalid

    await expect(jsonExporter.export(mockReport, invalidPath)).rejects.toThrow();
  });

  it('handles serialization of complex nested objects', async () => {
    const complexReport = {
      ...mockReport,
      metadata: {
        ...mockReport.metadata,
        nested: {
          deep: {
            value: 'test',
            date: new Date('2024-01-01'),
            map: new Map([['key', 'value']]) as any,
          },
        },
      },
    } as any;

    await jsonExporter.export(complexReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    expect(parsedData.metadata.nested.deep.date).toBe('2024-01-01T00:00:00.000Z');
    expect(parsedData.metadata.nested.deep.map).toEqual({ key: 'value' });
  });

  it('handles undefined and null values', async () => {
    const reportWithNulls = {
      ...mockReport,
      metadata: {
        ...mockReport.metadata,
        optionalField: undefined,
        nullField: null,
      },
    } as any;

    await jsonExporter.export(reportWithNulls, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.json');
    const jsonContent = readFileSync(outputPath, 'utf-8');
    const parsedData = JSON.parse(jsonContent);

    expect(parsedData.metadata.nullField).toBeNull();
    expect(parsedData.metadata.optionalField).toBeUndefined();
  });
});
