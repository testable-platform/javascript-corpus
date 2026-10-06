import { HTMLExporter } from '../src/output/html';
import { AnalysisReport } from '../src/types';
import { mkdirSync, readFileSync, rmSync } from 'fs';
import { resolve } from 'path';

describe('Teamwork Feature', () => {
  const outputPath = resolve(__dirname, '../test-tmp/teamwork-test');
  const reportPath = resolve(outputPath, 'git-spark-report.html');

  // Use a simplified mock that focuses on testing the HTML output
  const createMinimalMockReport = (): AnalysisReport => {
    return {
      metadata: {
        generatedAt: new Date('2025-01-01T00:00:00Z'),
        version: '1.0.0',
        repoPath: '/test/repo',
        analysisOptions: { repoPath: '/test/repo' },
        processingTime: 1000,
        gitVersion: '2.44.0',
        commit: 'test123',
        branch: 'main',
      },
      repository: {
        totalCommits: 100,
        totalAuthors: 5,
        totalFiles: 50,
        totalChurn: 10000,
        busFactor: 2,
        avgCommitsPerDay: 3.3,
        activeDays: 30,
        firstCommit: new Date('2024-12-01'),
        lastCommit: new Date('2025-01-01'),
        healthScore: 0.75,
        governanceScore: 0.8,
        languages: { typescript: 10000 },
      },
      authors: [
        {
          name: 'Alice',
          email: 'alice@example.com',
          commits: 50,
          insertions: 5000,
          deletions: 2000,
          churn: 7000,
          avgCommitSize: 140,
          filesChanged: 20,
          firstCommit: new Date('2024-12-01'),
          lastCommit: new Date('2025-01-01'),
          activeDays: 20,
          largestCommit: 500,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 0,
            afterHours: 0,
            weekends: 0,
          },
          detailed: {
            contribution: {
              impactScore: 0.8,
              fileTypeBreakdown: {},
              commitSizeDistribution: { small: 10, medium: 20, large: 5 },
              changeVelocity: 100,
            },
            collaboration: {
              sharedFilesCount: 10,
              coAuthors: [],
              reviewParticipation: { participated: 0, note: 'Git data only' },
              isolationScore: 0.2,
            },
            activity: {
              commitFrequency: 2.5,
              longestStreak: 10,
              avgTimeBetweenCommits: 1,
              burstActivity: 5,
            },
            codeOwnership: {
              primaryFiles: [],
              sharedOwnership: [],
              ownershipConcentration: 0.5,
            },
          },
        },
      ],
      files: [],
      hotspots: [],
      timeline: [],
      risks: {
        overallRisk: 'medium',
        highRiskFiles: [],
        riskFactors: {
          highChurnFiles: 1,
          manyAuthorFiles: 0,
          largeCommits: 2,
          recentChanges: 5,
        },
        recommendations: [],
      },
      governance: {
        score: 0.8,
        conventionalCommits: 80,
        traceabilityScore: 0.75,
        avgMessageLength: 60,
        wipCommits: 0,
        revertCommits: 0,
        shortMessages: 5,
        recommendations: [],
      },
      summary: {
        insights: ['Test insight'],
        actionItems: ['Test action'],
        healthRating: 'good' as const,
        keyMetrics: {
          commits: 100,
          authors: 5,
          files: 50,
          busFactor: 2,
        },
      },
      trends: {
        commitTrend: 'stable',
        authorGrowth: 'stable',
        churnTrend: 'decreasing',
      },
      currentState: {
        totalFiles: 50,
        fileTypes: {},
        avgFileSize: 20000,
        byExtension: [],
        byDirectory: {},
        topDirectories: [],
      },
    } as any; // Use 'as any' to bypass strict type checking for test purposes
  };

  beforeAll(() => {
    mkdirSync(outputPath, { recursive: true });
  });

  afterAll(() => {
    try {
      rmSync(outputPath, { recursive: true, force: true });
    } catch {
      /* ignore cleanup errors */
    }
  });

  it('should remove author sections when teamwork flag is true', async () => {
    const exporter = new HTMLExporter();
    const report = createMinimalMockReport();
    await exporter.export(report, outputPath, undefined, true);

    const html = readFileSync(reportPath, 'utf-8');

    // Verify author sections are NOT present
    expect(html).not.toContain('Top Contributors (Author Metrics)');
    expect(html).not.toContain('Author Activity Details');
    expect(html).not.toContain('href="#authors"');
    expect(html).not.toContain('href="#author-details"');

    // Verify team-focused sections ARE present
    expect(html).toContain('Team Activity Patterns');
    expect(html).toContain('File Activity Hotspots');
    expect(html).toContain('href="#team-patterns"');
  });

  it('should include author sections when teamwork flag is false', async () => {
    const exporter = new HTMLExporter();
    const report = createMinimalMockReport();
    await exporter.export(report, outputPath, undefined, false);

    const html = readFileSync(reportPath, 'utf-8');

    // Verify author sections ARE present
    expect(html).toContain('Top Contributors (Author Metrics)');
    expect(html).toContain('Author Activity Details');
    expect(html).toContain('href="#authors"');
    expect(html).toContain('href="#author-details"');

    // Verify team-focused sections ARE ALSO present
    expect(html).toContain('Team Activity Patterns');
    expect(html).toContain('File Activity Hotspots');
  });

  it('should include author sections when teamwork flag is undefined (default)', async () => {
    const exporter = new HTMLExporter();
    const report = createMinimalMockReport();
    await exporter.export(report, outputPath, undefined, undefined);

    const html = readFileSync(reportPath, 'utf-8');

    // Verify default behavior includes author sections
    expect(html).toContain('Top Contributors (Author Metrics)');
    expect(html).toContain('Author Activity Details');
  });
});
