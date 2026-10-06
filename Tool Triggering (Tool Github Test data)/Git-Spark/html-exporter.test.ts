import { HTMLExporter } from '../src/output/html.js';
import {
  generateCommitTrendChart,
  generateAuthorTrendChart,
  generateVolumeSparklines,
} from '../src/output/html-daily-trends.js';
import { AnalysisReport } from '../src/types/index.js';
import { existsSync, readFileSync, unlinkSync, rmSync } from 'fs';
import { resolve } from 'path';

describe('HTMLExporter (Phase 3)', () => {
  let exporter: HTMLExporter;
  let report: AnalysisReport;

  beforeEach(() => {
    exporter = new HTMLExporter();
    report = {
      metadata: {
        generatedAt: new Date(),
        version: '1.0.0',
        repoPath: '/test/repo',
        analysisOptions: { repoPath: '/test/repo' },
        processingTime: 1000,
        gitVersion: '2.44.0',
        commit: 'abcdef1234567890',
        branch: 'main',
      },
      repository: {
        totalCommits: 42,
        totalAuthors: 3,
        totalFiles: 18,
        totalChurn: 12345,
        firstCommit: new Date('2024-01-01'),
        lastCommit: new Date('2024-02-01'),
        activeDays: 31,
        avgCommitsPerDay: 1.35,
        languages: { typescript: 10000 },
        busFactor: 1,
        healthScore: 0.71,
        governanceScore: 0.55,
      },
      authors: [
        {
          name: 'Alice',
          email: 'alice@example.com',
          commits: 25,
          insertions: 8000,
          deletions: 2000,
          churn: 10000,
          filesChanged: 10,
          firstCommit: new Date('2024-01-01'),
          lastCommit: new Date('2024-02-01'),
          activeDays: 31,
          avgCommitSize: 400,
          largestCommit: 900,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 0,
            afterHours: 0,
            weekends: 0,
          },
        },
      ],
      files: [
        {
          path: 'src/example/file.ts',
          commits: 10,
          authors: ['alice@example.com'],
          churn: 5000,
          insertions: 4000,
          deletions: 1000,
          firstChange: new Date('2024-01-05'),
          lastChange: new Date('2024-01-30'),
          riskScore: 0.72,
          hotspotScore: 0.8,
          ownership: { 'alice@example.com': 10 },
          language: 'TypeScript',
        },
      ],
      hotspots: [],
      timeline: [
        { date: new Date('2024-01-01'), commits: 2, churn: 150, authors: 1, files: 3 },
        { date: new Date('2024-01-02'), commits: 1, churn: 50, authors: 1, files: 2 },
      ],
      risks: {
        highRiskFiles: [],
        riskFactors: { highChurnFiles: 1, manyAuthorFiles: 0, largeCommits: 2, recentChanges: 5 },
        recommendations: ['Encourage smaller commits'],
        overallRisk: 'low',
      },
      governance: {
        conventionalCommits: 10,
        traceabilityScore: 0.2,
        avgMessageLength: 55,
        wipCommits: 1,
        revertCommits: 0,
        shortMessages: 2,
        score: 0.55,
        recommendations: ['Adopt conventional commit format'],
      },
      teamScore: {
        overall: 78,
        collaboration: {
          score: 80,
          crossTeamInteraction: 72,
          knowledgeDistribution: 72,
          fileOwnershipDistribution: {
            exclusive: 40,
            shared: 45,
            collaborative: 15,
          },
          limitations: {
            dataSource: 'git-file-authorship-only' as const,
            knownLimitations: ['Based only on Git commit authorship, not actual collaboration'],
          },
        },
        consistency: {
          score: 75,
          velocityConsistency: 70,
          busFactorPercentage: 35,
          activeContributorRatio: 85,
          deliveryCadence: 75,
          contributionDistribution: {
            giniCoefficient: 0.3,
            topContributorDominance: 45,
          },
        },
        quality: {
          score: 82,
          commitMessageQuality: 75,
          refactoringActivity: 12,
          bugFixRatio: 25,
          documentationContribution: 18,
          testFileDetection: {
            hasTestFiles: true,
            testFiles: 5,
            testFileToSourceRatio: 28,
            limitations: {
              note: 'Detects test files only, not actual test execution coverage',
              recommendedTools: ['Jest', 'nyc', 'c8'],
            },
          },
          limitations: {
            qualityMeasurement: 'commit-message-pattern-analysis',
            testCoverageNote: 'File detection only, not execution coverage',
            knownLimitations: [
              'Cannot measure actual test coverage percentage',
              'Test file detection based on naming patterns only',
            ],
          },
        },
        workLifeBalance: {
          score: 76,
          commitTimePatterns: 78,
          afterHoursCommitFrequency: 22,
          weekendCommitActivity: 15,
          commitTimingIndicators: {
            highVelocityDays: 3,
            consecutiveCommitDays: 8,
            afterHoursCommits: 45,
          },
          teamActiveCoverage: {
            multiContributorDays: 60,
            soloContributorDays: 40,
            coveragePercentage: 60,
            note: 'Estimated from commit authoring patterns',
          },
          limitations: {
            timezoneWarning:
              'Commit times may not reflect actual working hours due to timezone differences',
            workPatternNote: 'Work patterns based on commit timing only',
            burnoutDetection: 'Cannot detect actual burnout, only commit patterns',
            recommendedApproach: 'Use as indicator only, supplement with team feedback',
            knownLimitations: [
              'Work patterns based on commit times only',
              'Cannot detect actual working hours or time zones',
            ],
          },
        },
        insights: {
          strengths: ['Strong code review culture', 'Good knowledge sharing'],
          improvements: ['Reduce overtime frequency', 'Improve documentation'],
          risks: ['Weekend work detected'],
          teamDynamics: 'balanced' as const,
          maturityLevel: 'mature' as const,
          sustainabilityRating: 'good' as const,
        },
        recommendations: [
          'Consider implementing pair programming sessions',
          'Establish clear boundaries for weekend work',
        ],
      },
      summary: {
        healthRating: 'good',
        keyMetrics: { commits: 42, authors: 3, files: 18, healthScore: 71 },
        insights: ['Low bus factor - knowledge is concentrated in few developers'],
        actionItems: ['Implement commit message standards'],
      },
    } as unknown as AnalysisReport;
  });

  const outDir = './test-reports';

  afterEach(() => {
    const f = resolve(outDir, 'git-spark-report.html');
    if (existsSync(f)) unlinkSync(f);
    if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  });

  it('renders required meta tags & navigation', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('<meta name="generator"');
    expect(html).toContain('<meta name="report-date"');
    expect(html).toContain('<meta name="repository"');
    expect(html).toContain('<nav class="main-nav"');
    expect(html).toContain('Executive Summary');
  });

  it('includes key metric cards and export controls', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toMatch(/Commits<\/div>/);
    expect(html).toMatch(/Contributors<\/div>/);
    expect(html).toMatch(/Files Changed<\/div>/);
    // Export functionality has been removed for standalone reports
    expect(html).not.toContain('data-export="json"');
    expect(html).not.toContain('Authors CSV');
  });

  it('escapes HTML in dynamic content (raw appears only in serialized JSON)', async () => {
    report.authors[0].name = 'Alice <script>alert(1)</script>';
    report.files[0].path = 'src/<Injected>.ts';
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('Alice &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('src/&lt;Injected&gt;.ts');
    // Raw script tag may exist inside serialized JSON export blob; ensure not present directly inside table cell markup
    const forbiddenPattern = '<td>Alice <script>alert(1)</script>';
    expect(html).not.toContain(forbiddenPattern);
  });

  it('shows current sections and navigation', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('Executive Summary');
    expect(html).toContain('Team Patterns');
    expect(html).toContain('Author Details');
    expect(html).toContain('File Hotspots');
  });

  it('includes CSS variables, smooth scroll behavior, and dataset toggles', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain(':root {');
    expect(html).toContain('--color-primary');
    expect(html).toContain('scroll-behavior: smooth');
    // Dataset toggles have been removed from Risk Overview section
    expect(html).not.toContain('dataset-toggles');
  });

  // Test detailed author metrics and edge cases
  it('handles detailed author metrics with fallbacks', async () => {
    // Add detailed metrics to first author
    (report.authors[0] as any).detailed = {
      contribution: {
        totalLines: 10000,
        productivity: { commitsPerDay: 2.5, linesPerCommit: 400 },
        impact: { impactScore: 0.85, reach: 0.7 },
        largestCommitDetails: {
          size: 1500,
          hash: 'abc123def456',
          date: new Date('2024-01-15'),
          message: 'Major refactoring of core module',
        },
        filesAndScope: {
          uniqueFiles: 10,
          avgFilesPerCommit: 2.5,
          fileDiversityScore: 0.6,
          directoryFocus: [
            { directory: 'src/core', percentage: 60 },
            { directory: 'src/utils', percentage: 25 },
            { directory: 'test', percentage: 15 },
          ],
          sourceVsPublishedRatio: {
            sourceLines: { insertions: 8000, deletions: 2000 },
            sourceCommits: 20,
          },
        },
        // Test case: Very uneven distribution to verify proportionality
        commitSizeDistribution: {
          micro: 1, // 3.6% - Very narrow bar
          small: 15, // 53.6% - Very wide bar (dominant)
          medium: 8, // 28.6% - Medium width bar
          large: 3, // 10.7% - Narrow bar
          veryLarge: 1, // 3.6% - Very narrow bar
        },
      },
      collaboration: {
        filesSharedWithOthers: 5,
        reviewParticipation: 0.8,
        limitations: {
          reviewerDataAvailable: false,
          estimationMethod: 'merge-commits' as const,
          platformSpecific: true,
        },
      },
      patterns: {},
      insights: {
        positivePatterns: ['Consistent contributor', 'Good test coverage'],
        growthAreas: ['Could reduce commit size', 'More code reviews'],
      },
    };

    await exporter.export(report, outDir);

    // Also create a demo report for user to see proportional bars
    const demoOutDir = './demo-proportional-bars';
    await exporter.export(report, demoOutDir);
    /* eslint-disable no-console */
    console.log('\n🎯 PROPORTIONAL BARS DEMO REPORT CREATED!');
    console.log(`📍 Location: ${demoOutDir}/git-spark-report.html`);
    console.log('📊 Commit Size Distribution:');
    console.log('   • Micro (1 commit, 3.6%): Very narrow bar');
    console.log('   • Small (15 commits, 53.6%): Very wide bar (dominant)');
    console.log('   • Medium (8 commits, 28.6%): Medium width bar');
    console.log('   • Large (3 commits, 10.7%): Narrow bar');
    console.log('   • Very Large (1 commit, 3.6%): Very narrow bar');
    console.log('📖 Open the HTML file to see proportional bars in action!\n');
    /* eslint-enable no-console */

    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

    // Test detailed author profile generation
    expect(html).toContain('Major refactoring of core module');
    expect(html).toContain('abc123d'); // shortened hash
    // The insights may not render in the expected format, so let's check for the data
    expect(html).toContain('Could reduce commit size');
    expect(html).toContain('src/core/ (60%)');
  });

  it('handles commit size distribution edge cases', async () => {
    // Test with zero total commits
    (report.authors[0] as any).detailed = {
      patterns: {
        commitSizeDistribution: {
          micro: 0,
          small: 0,
          medium: 0,
          large: 0,
          veryLarge: 0,
        },
      },
    };

    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('No data available');
  });

  it('handles missing detailed metrics gracefully', async () => {
    // Test with minimal detailed data
    (report.authors[0] as any).detailed = {
      contribution: {},
      collaboration: {
        limitations: {
          reviewerDataAvailable: false,
          estimationMethod: 'merge-commits' as const,
          platformSpecific: true,
        },
      },
      patterns: {},
      insights: {},
    };

    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    // Should not crash and should generate valid HTML
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('tests risk band calculations', async () => {
    // Add files with different risk scores to test risk band logic
    report.files = [
      {
        path: 'high-risk.ts',
        commits: 10,
        authors: ['alice@example.com'],
        churn: 5000,
        insertions: 4000,
        deletions: 1000,
        firstChange: new Date('2024-01-05'),
        lastChange: new Date('2024-01-30'),
        riskScore: 0.85, // high risk (>=70%)
        hotspotScore: 0.8,
        ownership: { 'alice@example.com': 10 },
        language: 'TypeScript',
      },
      {
        path: 'medium-risk.ts',
        commits: 5,
        authors: ['alice@example.com'],
        churn: 2000,
        insertions: 1500,
        deletions: 500,
        firstChange: new Date('2024-01-10'),
        lastChange: new Date('2024-01-25'),
        riskScore: 0.6, // medium risk (>=50%)
        hotspotScore: 0.6,
        ownership: { 'alice@example.com': 5 },
        language: 'TypeScript',
      },
      {
        path: 'low-risk.ts',
        commits: 2,
        authors: ['alice@example.com'],
        churn: 500,
        insertions: 400,
        deletions: 100,
        firstChange: new Date('2024-01-20'),
        lastChange: new Date('2024-01-22'),
        riskScore: 0.4, // low risk (>=30%)
        hotspotScore: 0.3,
        ownership: { 'alice@example.com': 2 },
        language: 'TypeScript',
      },
      {
        path: 'minimal-risk.ts',
        commits: 1,
        authors: ['alice@example.com'],
        churn: 100,
        insertions: 100,
        deletions: 0,
        firstChange: new Date('2024-01-25'),
        lastChange: new Date('2024-01-25'),
        riskScore: 0.15, // minimal risk (<30%)
        hotspotScore: 0.1,
        ownership: { 'alice@example.com': 1 },
        language: 'TypeScript',
      },
    ];

    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

    // Test risk band CSS classes are applied
    expect(html).toContain('risk-high');
    expect(html).toContain('risk-medium');
    expect(html).toContain('risk-low');
    expect(html).toContain('risk-minimal');
  });

  it('handles path truncation for long file paths', async () => {
    report.files[0].path =
      'src/very/long/path/that/should/be/truncated/because/it/is/too/long/for/display/file.ts';

    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

    // Should contain truncated path with ellipsis
    expect(html).toContain('...');
    // The path might still appear in the title attribute, so check for truncation in the display text
    expect(html).toMatch(/src\/very\/long\/path.*\.\.\..*display\/file\.ts/);
  });

  it('merges authors with same email address (case-insensitive)', async () => {
    // Create test data with authors having same email in different cases
    const testReport = { ...report };
    // Create two authors with same email but different cases
    const originalAuthor = testReport.authors[0];
    testReport.authors = [
      {
        ...originalAuthor,
        name: 'John Doe',
        email: 'John.Doe@Example.COM',
        commits: 10,
      },
      {
        ...originalAuthor,
        name: 'john.doe@example.com',
        email: 'john.doe@example.com',
        commits: 5,
      },
    ];

    await exporter.export(testReport, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

    // Should have merged the authors - only one author profile should exist
    const authorProfileMatches = html.match(/<div class="author-profile-card"/g);
    expect(authorProfileMatches).toHaveLength(1);

    // Email should be lowercase in the output
    expect(html).toContain('john.doe@example.com');
    expect(html).not.toContain('John.Doe@Example.COM');

    // Should show combined commit count (10 + 5 = 15)
    expect(html).toContain('>15<');

    // Should prefer the more descriptive name over the email address
    expect(html).toContain('John Doe');
  });

  describe('Daily Trends Coverage Tests', () => {
    it('includes daily trends section when data is present', async () => {
      const testReport = {
        ...report,
        dailyTrends: {
          analysisMetadata: {
            timezone: 'UTC',
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-02T23:59:59.999Z',
            totalDays: 2,
            activeDays: 1,
          },
          flowMetrics: [
            {
              day: '2024-01-01',
              date: '2024-01-01',
              commitsPerDay: 3,
              uniqueAuthorsPerDay: 2,
              grossLinesChangedPerDay: 150,
              filesChangedPerDay: 8,
              filesTouchedPerDay: 8,
              commitSizeDistribution: { p50: 25, p90: 100 },
            },
          ],
          stabilityMetrics: [],
          ownershipMetrics: [],
          couplingMetrics: [],
          hygieneMetrics: [],
          contributionsGraph: { weeks: [], totalContributions: 0 },
        } as any,
      };

      await exporter.export(testReport, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

      // Check for main daily trends components
      expect(html).toContain('Detailed Daily Tables');
      expect(html).toContain('Visual Trend Analysis');
      expect(html).toContain('Daily Commits Trend');
      expect(html).toContain('Active Authors Trend');
    });

    it('omits daily trends section when no data provided', async () => {
      const testReport = { ...report }; // No dailyTrends property

      await exporter.export(testReport, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

      // Should not contain daily trends section
      expect(html).not.toContain('Detailed Daily Tables');
      expect(html).not.toContain('Visual Trend Analysis');
    });

    it('handles empty flowMetrics array', async () => {
      const testReport = {
        ...report,
        dailyTrends: {
          analysisMetadata: {
            timezone: 'UTC',
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-01T23:59:59.999Z',
            totalDays: 1,
            activeDays: 0,
          },
          flowMetrics: [],
          stabilityMetrics: [],
          ownershipMetrics: [],
          couplingMetrics: [],
          hygieneMetrics: [],
          contributionsGraph: { weeks: [], totalContributions: 0 },
        } as any,
      };

      await exporter.export(testReport, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

      // Should still generate section but handle empty data
      expect(html).toContain('Detailed Daily Tables');
      expect(html).toContain('No data available');
    });

    it('generates chart components', async () => {
      const testReport = {
        ...report,
        dailyTrends: {
          analysisMetadata: {
            timezone: 'UTC',
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-02T23:59:59.999Z',
            totalDays: 2,
            activeDays: 2,
          },
          flowMetrics: [
            {
              day: '2024-01-01',
              date: '2024-01-01',
              commitsPerDay: 3,
              uniqueAuthorsPerDay: 2,
              grossLinesChangedPerDay: 150,
              filesChangedPerDay: 8,
              filesTouchedPerDay: 8,
              commitSizeDistribution: { p50: 25, p90: 100 },
            },
            {
              day: '2024-01-02',
              date: '2024-01-02',
              commitsPerDay: 5,
              uniqueAuthorsPerDay: 1,
              grossLinesChangedPerDay: 200,
              filesChangedPerDay: 12,
              filesTouchedPerDay: 12,
              commitSizeDistribution: { p50: 30, p90: 120 },
            },
          ],
          stabilityMetrics: [],
          ownershipMetrics: [],
          couplingMetrics: [],
          hygieneMetrics: [],
          contributionsGraph: { weeks: [], totalContributions: 0 },
        } as any,
      };

      await exporter.export(testReport, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

      // Check for chart elements
      expect(html).toContain('<svg');
      expect(html).toContain('trend-chart');
      expect(html).toContain('sparklines-container');
      expect(html).toContain('<svg'); // SVG sparklines instead of .spark-bar divs
      expect(html).toContain('Lines Changed');
      expect(html).toContain('Files Touched');
    });

    it('includes proper CSS styles for daily trends', async () => {
      const testReport = {
        ...report,
        dailyTrends: {
          analysisMetadata: {
            timezone: 'UTC',
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-01T23:59:59.999Z',
            totalDays: 1,
            activeDays: 1,
          },
          flowMetrics: [
            {
              day: '2024-01-01',
              date: '2024-01-01',
              commitsPerDay: 1,
              uniqueAuthorsPerDay: 1,
              grossLinesChangedPerDay: 50,
              filesChangedPerDay: 3,
              filesTouchedPerDay: 3,
              commitSizeDistribution: { p50: 15, p90: 50 },
            },
          ],
          stabilityMetrics: [],
          ownershipMetrics: [],
          couplingMetrics: [],
          hygieneMetrics: [],
          contributionsGraph: { weeks: [], totalContributions: 0 },
        } as any,
      };

      await exporter.export(testReport, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

      // Check for chart-specific CSS styles and SVG elements
      expect(html).toContain('.trend-chart');
      expect(html).toContain('.sparklines-container');
      expect(html).toContain('<svg'); // SVG sparklines instead of .spark-bar divs
      expect(html).toContain('.charts-grid');
      expect(html).toContain('/* Daily Trends Section Styles */');
    });

    it('tests chart generation method accessibility', () => {
      // Test that chart generation functions can be called directly
      const mockFlowMetrics = [
        {
          day: '2024-01-01',
          commitsPerDay: 3,
          uniqueAuthorsPerDay: 2,
          grossLinesChangedPerDay: 150,
          filesChangedPerDay: 8,
        },
      ];

      expect(() => {
        generateCommitTrendChart(mockFlowMetrics);
      }).not.toThrow();

      expect(() => {
        generateAuthorTrendChart(mockFlowMetrics);
      }).not.toThrow();

      expect(() => {
        generateVolumeSparklines(mockFlowMetrics);
      }).not.toThrow();
    });
    it('handles export errors gracefully', async () => {
      const invalidPath = '\0invalid';
      await expect(exporter.export(report, invalidPath)).rejects.toThrow();
    });

    it('handles different date range options', async () => {
      const outDir = './test-html-output';

      // Test with since and until
      const reportWithSinceUntil = {
        ...report,
        metadata: {
          ...report.metadata,
          analysisOptions: {
            ...report.metadata.analysisOptions,
            since: '2024-01-01',
            until: '2024-12-31',
          },
        },
      };
      await exporter.export(reportWithSinceUntil, outDir);
      expect(existsSync(resolve(outDir, 'git-spark-report.html'))).toBe(true);

      // Test with only since
      const reportWithSince = {
        ...report,
        metadata: {
          ...report.metadata,
          analysisOptions: {
            ...report.metadata.analysisOptions,
            since: '2024-01-01',
          },
        },
      };
      await exporter.export(reportWithSince, outDir);
      expect(existsSync(resolve(outDir, 'git-spark-report.html'))).toBe(true);

      // Test with only until
      const reportWithUntil = {
        ...report,
        metadata: {
          ...report.metadata,
          analysisOptions: {
            ...report.metadata.analysisOptions,
            until: '2024-12-31',
          },
        },
      };
      await exporter.export(reportWithUntil, outDir);
      expect(existsSync(resolve(outDir, 'git-spark-report.html'))).toBe(true);

      // Test with days
      const reportWithDays = {
        ...report,
        metadata: {
          ...report.metadata,
          analysisOptions: {
            ...report.metadata.analysisOptions,
            days: 30,
          },
        },
      };
      await exporter.export(reportWithDays, outDir);
      expect(existsSync(resolve(outDir, 'git-spark-report.html'))).toBe(true);

      // Clean up
      if (existsSync(outDir)) {
        rmSync(outDir, { recursive: true });
      }
    });

    it('handles stability metrics in daily trends', async () => {
      const outDir = './test-html-output';
      const reportWithStability = {
        ...report,
        teamScore: report.teamScore, // Include teamScore
        dailyTrends: {
          analysisMetadata: {
            timezone: 'UTC',
            totalDays: 1,
            activeDays: 1,
          },
          flowMetrics: [],
          stabilityMetrics: [
            {
              day: '2024-01-01',
              revertsPerDay: 1,
              mergeRatioPerDay: 0.8,
              retouchRate: 0.15,
              renamesPerDay: 2,
              outOfHoursShare: 0.12,
            },
          ],
          ownershipMetrics: [],
          couplingMetrics: [],
          hygieneMetrics: [],
          contributionsGraph: { weeks: [], totalContributions: 0 },
        } as any,
      };

      await exporter.export(reportWithStability, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
      expect(html).toContain('Reverts');

      if (existsSync(outDir)) {
        rmSync(outDir, { recursive: true });
      }
    });

    it('handles file type breakdown', async () => {
      const outDir = './test-html-output';
      const reportWithFileTypes = {
        ...report,
        dailyTrends: report.dailyTrends, // Include analysisMetadata
        currentState: {
          totalFiles: 100,
          totalSizeBytes: 1000000,
          byExtension: [
            { extension: 'ts', language: 'TypeScript', fileCount: 50, totalSizeBytes: 500000, percentage: 50, averageFileSize: 10000 },
          ],
          fileTypeBreakdown: {
            byExtension: [{ extension: 'ts', percentage: 50 }],
            categories: {
              code: { files: 80, percentage: 80 },
            },
          },
        } as any,
        teamScore: report.teamScore, // Include teamScore to avoid errors
      };

      await exporter.export(reportWithFileTypes, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
      expect(html).toBeTruthy();

      if (existsSync(outDir)) {
        rmSync(outDir, { recursive: true });
      }
    });

    it('handles ownership metrics in daily trends', async () => {
      const outDir = './test-html-output';
      const reportWithOwnership = {
        ...report,
        teamScore: report.teamScore,
        dailyTrends: {
          analysisMetadata: {
            timezone: 'UTC',
            totalDays: 2,
            activeDays: 2,
          },
          flowMetrics: [],
          stabilityMetrics: [],
          ownershipMetrics: [
            {
              day: '2024-01-01',
              knowledgeConcentration: 0.65,
              busFactor: 3,
              primaryOwnerCoverage: 0.85,
              sharedOwnership: 0.55,
              newFilesCreatedPerDay: 5,
              singleOwnerFilesTouched: 12,
              filesTouchedToday: 20,
              singleOwnerShare: 0.60,
              avgAuthorsPerFile: 1.8,
            },
            {
              day: '2024-01-02',
              knowledgeConcentration: 0.70,
              busFactor: 2,
              primaryOwnerCoverage: 0.90,
              sharedOwnership: 0.50,
              newFilesCreatedPerDay: 3,
              singleOwnerFilesTouched: 15,
              filesTouchedToday: 18,
              singleOwnerShare: 0.83,
              avgAuthorsPerFile: 1.5,
            },
          ],
          couplingMetrics: [],
          hygieneMetrics: [],
          contributionsGraph: { weeks: [], totalContributions: 0 },
        } as any,
      };

      await exporter.export(reportWithOwnership, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
      expect(html).toContain('Daily Ownership Patterns');
      expect(html).toContain('Single Owner Files');

      if (existsSync(outDir)) {
        rmSync(outDir, { recursive: true });
      }
    });

    it('handles coupling metrics in daily trends', async () => {
      const outDir = './test-html-output';
      const reportWithCoupling = {
        ...report,
        teamScore: report.teamScore,
        dailyTrends: {
          analysisMetadata: {
            timezone: 'UTC',
            totalDays: 2,
            activeDays: 2,
          },
          flowMetrics: [],
          stabilityMetrics: [],
          ownershipMetrics: [],
          couplingMetrics: [
            {
              day: '2024-01-01',
              avgCouplingStrength: 0.45,
              strongCouplingCount: 5,
              avgFilesPerChange: 3.2,
              coChangeDensityPerDay: 0.35,
              totalCoChangePairs: 45,
              multiFileCommits: 12,
            },
            {
              day: '2024-01-02',
              avgCouplingStrength: 0.50,
              strongCouplingCount: 6,
              avgFilesPerChange: 3.5,
              coChangeDensityPerDay: 0.40,
              totalCoChangePairs: 52,
              multiFileCommits: 15,
            },
          ],
          hygieneMetrics: [],
          contributionsGraph: { weeks: [], totalContributions: 0 },
        } as any,
      };

      await exporter.export(reportWithCoupling, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
      expect(html).toContain('Daily Coupling Indicators');
      expect(html).toContain('Co-change Density');

      if (existsSync(outDir)) {
        rmSync(outDir, { recursive: true });
      }
    });

    it('handles hygiene metrics in daily trends', async () => {
      const outDir = './test-html-output';
      const reportWithHygiene = {
        ...report,
        teamScore: report.teamScore,
        dailyTrends: {
          analysisMetadata: {
            timezone: 'UTC',
            totalDays: 2,
            activeDays: 2,
          },
          flowMetrics: [],
          stabilityMetrics: [],
          ownershipMetrics: [],
          couplingMetrics: [],
          hygieneMetrics: [
            {
              day: '2024-01-01',
              conventionalCommitShare: 0.75,
              semanticCommitShare: 0.80,
              longMessageShare: 0.65,
              typedCommitShare: 0.70,
            },
            {
              day: '2024-01-02',
              conventionalCommitShare: 0.78,
              semanticCommitShare: 0.82,
              longMessageShare: 0.68,
              typedCommitShare: 0.72,
            },
          ],
          contributionsGraph: { weeks: [], totalContributions: 0 },
        } as any,
      };

      await exporter.export(reportWithHygiene, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
      expect(html).toContain('Conventional Commits');

      if (existsSync(outDir)) {
        rmSync(outDir, { recursive: true });
      }
    });
  });
});
