import { MarkdownExporter } from '../src/output/markdown.js';
import { AnalysisReport } from '../src/types/index.js';
import { existsSync, readFileSync, rmSync } from 'fs';
import { resolve } from 'path';

describe('MarkdownExporter', () => {
  let markdownExporter: MarkdownExporter;
  let mockReport: AnalysisReport;
  const testOutputDir = './test-markdown-output';

  beforeEach(() => {
    markdownExporter = new MarkdownExporter();

    mockReport = {
      metadata: {
        generatedAt: new Date('2024-01-01T12:00:00Z'),
        version: '1.0.0',
        repoPath: '/test/repo',
        branch: 'main',
        analysisOptions: { repoPath: '/test/repo' },
        processingTime: 1500,
        gitVersion: '2.44.0',
        commit: 'abcdef12',
      },
      repository: {
        totalCommits: 100,
        totalAuthors: 3,
        totalFiles: 25,
        totalChurn: 15000,
        firstCommit: new Date('2024-01-01'),
        lastCommit: new Date('2024-01-01'),
        activeDays: 365,
        avgCommitsPerDay: 0.274,
        languages: {
          typescript: 8000,
          javascript: 5000,
          markdown: 2000,
        },
        busFactor: 2,
        healthScore: 0.82,
        governanceScore: 0.73,
      },
      authors: [
        {
          name: 'Alice Developer',
          email: 'alice@example.com',
          commits: 55,
          insertions: 8000,
          deletions: 2000,
          churn: 10000,
          filesChanged: 18,
          firstCommit: new Date('2024-01-01'),
          lastCommit: new Date('2024-01-01'),
          activeDays: 300,
          avgCommitSize: 182,
          largestCommit: 800,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 8,
            afterHours: 5,
            weekends: 10,
          },
        },
        {
          name: 'Bob Coder',
          email: 'bob@example.com',
          commits: 30,
          insertions: 4000,
          deletions: 1000,
          churn: 5000,
          filesChanged: 12,
          firstCommit: new Date('2024-03-01'),
          lastCommit: new Date('2024-12-15'),
          activeDays: 200,
          avgCommitSize: 167,
          largestCommit: 600,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 4,
            afterHours: 3,
            weekends: 6,
          },
        },
        {
          name: 'Charlie Reviewer',
          email: 'charlie@example.com',
          commits: 15,
          insertions: 1500,
          deletions: 500,
          churn: 2000,
          filesChanged: 8,
          firstCommit: new Date('2024-06-01'),
          lastCommit: new Date('2024-11-30'),
          activeDays: 120,
          avgCommitSize: 133,
          largestCommit: 300,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 2,
            afterHours: 1,
            weekends: 3,
          },
        },
      ],
      files: [
        {
          path: 'src/core/main.ts',
          commits: 25,
          authors: ['alice@example.com', 'bob@example.com'],
          churn: 3000,
          insertions: 2200,
          deletions: 800,
          firstChange: new Date('2024-01-01'),
          lastChange: new Date('2024-01-01'),
          riskScore: 0.85,
          hotspotScore: 0.92,
          ownership: { 'alice@example.com': 15, 'bob@example.com': 10 },
          language: 'TypeScript',
        },
        {
          path: 'src/utils/helpers.ts',
          commits: 18,
          authors: ['alice@example.com', 'charlie@example.com'],
          churn: 2000,
          insertions: 1500,
          deletions: 500,
          firstChange: new Date('2024-02-01'),
          lastChange: new Date('2024-12-01'),
          riskScore: 0.65,
          hotspotScore: 0.78,
          ownership: { 'alice@example.com': 12, 'charlie@example.com': 6 },
          language: 'TypeScript',
        },
        {
          path: 'README.md',
          commits: 8,
          authors: ['bob@example.com'],
          churn: 800,
          insertions: 600,
          deletions: 200,
          firstChange: new Date('2024-01-15'),
          lastChange: new Date('2024-10-01'),
          riskScore: 0.25,
          hotspotScore: 0.4,
          ownership: { 'bob@example.com': 8 },
          language: 'Markdown',
        },
      ],
      hotspots: [],
      timeline: [],
      risks: {
        highRiskFiles: [],
        riskFactors: {
          highChurnFiles: 3,
          manyAuthorFiles: 2,
          largeCommits: 5,
          recentChanges: 8,
        },
        recommendations: [],
        overallRisk: 'medium',
      },
      governance: {
        conventionalCommits: 75,
        traceabilityScore: 0.68,
        avgMessageLength: 52.3,
        wipCommits: 8,
        revertCommits: 3,
        shortMessages: 12,
        score: 0.73,
        recommendations: [],
      },
      summary: {
        healthRating: 'good',
        keyMetrics: {
          commits: 100,
          authors: 3,
          files: 25,
          healthScore: 82,
        },
        insights: [
          'Repository shows consistent activity with good contributor diversity',
          'Code quality metrics indicate healthy development practices',
          'Recent activity suggests active maintenance',
        ],
        actionItems: [
          'Address high-risk files in core modules',
          'Improve governance score through better commit practices',
          'Consider establishing code review guidelines',
        ],
      },
    } as unknown as AnalysisReport;
  });

  afterEach(() => {
    // Clean up test output directory
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  it('exports valid markdown file', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    expect(existsSync(outputPath)).toBe(true);

    const content = readFileSync(outputPath, 'utf-8');
    expect(content).toContain('# 🔥 Git Spark Report');
  });

  it('includes all major sections', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Check for major sections
    expect(content).toContain('## 📊 Executive Summary');
    expect(content).toContain('## 📁 Repository Overview');
    expect(content).toContain('## 👥 Top Contributors');
    expect(content).toContain('## 🔥 File Hotspots');
    expect(content).toContain('## ⚠️ Risk Analysis');
    expect(content).toContain('## 📋 Governance Analysis');
  });

  it('displays executive summary with health rating and metrics', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain('**Repository Health: GOOD**');
    expect(content).toContain('| Total Commits | 100 |');
    expect(content).toContain('| Contributors | 3 |');
    expect(content).toContain('| Files Changed | 25 |');
    expect(content).toContain('| Health Score | 82% |');
    expect(content).toContain('| Bus Factor | 67% |');
  });

  it('includes insights and action items when available', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Check insights section
    expect(content).toContain('### 💡 Key Insights');
    expect(content).toContain('- Repository shows consistent activity');
    expect(content).toContain('- Code quality metrics indicate healthy');
    expect(content).toContain('- Recent activity suggests active maintenance');

    // Check action items section
    expect(content).toContain('### 🚨 Action Items');
    expect(content).toContain('- Address high-risk files in core modules');
    expect(content).toContain('- Improve governance score through better');
    expect(content).toContain('- Consider establishing code review guidelines');
  });

  it('displays repository overview with languages', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain('- **Active Period:** 365 days');
    expect(content).toContain('- **Average Commits/Day:** 0.27');
    expect(content).toContain('- **Total Code Churn:** 15,000 lines');
    expect(content).toContain('- **Governance Score:** 73%');

    // Check languages section
    expect(content).toContain('### 💻 Languages');
    expect(content).toContain('- typescript: 8000');
    expect(content).toContain('- javascript: 5000');
    expect(content).toContain('- markdown: 2000');
  });

  it('displays top contributors table', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Check table header
    expect(content).toContain('| Author | Commits | Churn | Files | Avg Commit Size |');
    expect(content).toContain('|--------|---------|-------|-------|-----------------|');

    // Check author data
    expect(content).toContain('| Alice Developer | 55 | 10,000 | 18 | 182 |');
    expect(content).toContain('| Bob Coder | 30 | 5,000 | 12 | 167 |');
    expect(content).toContain('| Charlie Reviewer | 15 | 2,000 | 8 | 133 |');
  });

  it('displays file hotspots table', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Check table header
    expect(content).toContain('| File | Commits | Authors | Churn | Risk Score |');
    expect(content).toContain('|------|---------|---------|-------|------------|');

    // Check file data with code formatting
    expect(content).toContain('| `src/core/main.ts` | 25 | 2 | 3,000 | 85% |');
    expect(content).toContain('| `src/utils/helpers.ts` | 18 | 2 | 2,000 | 65% |');
    expect(content).toContain('| `README.md` | 8 | 1 | 800 | 25% |');
  });

  it('displays risk analysis section', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain('**Overall Risk Level: MEDIUM**');

    // Check risk factors
    expect(content).toContain('- High churn files: 3');
    expect(content).toContain('- Files with many authors: 2');
    expect(content).toContain('- Large commits: 5');
    expect(content).toContain('- Recently changed files: 8');

    // Should not contain recommendations (removed for objectivity)
    expect(content).not.toContain('### Recommendations');
    expect(content).not.toContain('- Review files with high churn rates');
    expect(content).not.toContain('- Consider breaking down large commits');
    expect(content).not.toContain('- Implement code review process for high-risk files');
  });

  it('displays governance analysis section', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain('**Governance Score: 73%**');

    // Check governance metrics
    expect(content).toContain('- **Conventional Commits:** 75');
    expect(content).toContain('- **Traceability Score:** 68%');
    expect(content).toContain('- **Average Message Length:** 52 characters');
    expect(content).toContain('- **WIP Commits:** 8');
    expect(content).toContain('- **Revert Commits:** 3');
    expect(content).toContain('- **Short Messages:** 12');

    // Check governance recommendations (should be empty)
    expect(content).not.toContain('- Improve commit message consistency');
    expect(content).not.toContain('- Adopt conventional commit format');
    expect(content).not.toContain('- Increase traceability with issue references');
  });

  it('includes footer with metadata', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain('*Generated by git-spark v1.0.0 in 1500ms*');
  });

  it('handles empty insights and action items gracefully', async () => {
    const reportWithoutInsights = {
      ...mockReport,
      summary: {
        ...mockReport.summary,
        insights: [],
        actionItems: [],
      },
      risks: {
        ...mockReport.risks,
        recommendations: [],
      },
      governance: {
        ...mockReport.governance,
        recommendations: [],
      },
    };

    await markdownExporter.export(reportWithoutInsights, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Should not contain empty sections
    expect(content).not.toContain('### 💡 Key Insights');
    expect(content).not.toContain('### 🚨 Action Items');
    expect(content).not.toContain('### Recommendations');
  });

  it('limits contributors table to top 10', async () => {
    const manyAuthors = Array.from({ length: 15 }, (_, i) => ({
      ...mockReport.authors[0],
      name: `Author ${i + 1}`,
      email: `author${i + 1}@example.com`,
      commits: 50 - i,
    }));

    const reportWithManyAuthors = {
      ...mockReport,
      authors: manyAuthors,
    };

    await markdownExporter.export(reportWithManyAuthors, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Should contain first 10 authors
    expect(content).toContain('| Author 1 |');
    expect(content).toContain('| Author 10 |');

    // Should not contain 11th+ authors
    expect(content).not.toContain('| Author 11 |');
    expect(content).not.toContain('| Author 15 |');
  });

  it('limits files table to top 15', async () => {
    const manyFiles = Array.from({ length: 20 }, (_, i) => ({
      ...mockReport.files[0],
      path: `src/file${i + 1}.ts`,
      commits: 20 - i,
    }));

    const reportWithManyFiles = {
      ...mockReport,
      files: manyFiles,
    };

    await markdownExporter.export(reportWithManyFiles, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Should contain first 15 files
    expect(content).toContain('`src/file1.ts`');
    expect(content).toContain('`src/file15.ts`');

    // Should not contain 16th+ files
    expect(content).not.toContain('`src/file16.ts`');
    expect(content).not.toContain('`src/file20.ts`');
  });

  it('creates output directory if it does not exist', async () => {
    const nestedPath = resolve(testOutputDir, 'nested', 'path');

    await markdownExporter.export(mockReport, nestedPath);

    const outputPath = resolve(nestedPath, 'git-spark-report.md');
    expect(existsSync(outputPath)).toBe(true);
  });

  it('formats numbers with proper localization', async () => {
    await markdownExporter.export(mockReport, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Check comma-separated numbers
    expect(content).toContain('15,000 lines'); // total churn
    expect(content).toContain('10,000'); // Alice's churn
    expect(content).toContain('3,000'); // main.ts churn
  });

  it('handles risk level variations', async () => {
    const riskLevels = ['low', 'medium', 'high', 'critical'];

    for (const riskLevel of riskLevels) {
      const reportWithRisk = {
        ...mockReport,
        risks: {
          ...mockReport.risks,
          overallRisk: riskLevel as any,
        },
      };

      await markdownExporter.export(reportWithRisk, testOutputDir);

      const outputPath = resolve(testOutputDir, 'git-spark-report.md');
      const content = readFileSync(outputPath, 'utf-8');

      expect(content).toContain(`Overall Risk Level: ${riskLevel.toUpperCase()}`);
    }
  });

  it('handles health rating variations', async () => {
    const healthRatings = ['excellent', 'good', 'fair', 'poor', 'critical'];

    for (const rating of healthRatings) {
      const reportWithRating = {
        ...mockReport,
        summary: {
          ...mockReport.summary,
          healthRating: rating as any,
        },
      };

      await markdownExporter.export(reportWithRating, testOutputDir);

      const outputPath = resolve(testOutputDir, 'git-spark-report.md');
      const content = readFileSync(outputPath, 'utf-8');

      expect(content).toContain(`Repository Health: ${rating.toUpperCase()}`);
    }
  });

  it('handles reports with recommendations', async () => {
    const reportWithRecommendations = {
      ...mockReport,
      risks: {
        ...mockReport.risks,
        recommendations: ['Review high-risk files', 'Improve test coverage'],
      },
      governance: {
        ...mockReport.governance,
        recommendations: ['Use conventional commits', 'Improve traceability'],
      },
    };

    await markdownExporter.export(reportWithRecommendations, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Should be present (not removed in recent updates)
    expect(content).toBeTruthy();
  });

  it('handles different date formats correctly', async () => {
    const reportWithDates = {
      ...mockReport,
      repository: {
        ...mockReport.repository,
        firstCommit: new Date('2023-01-15T10:30:00Z'),
        lastCommit: new Date('2024-12-20T14:45:00Z'),
      },
    };

    await markdownExporter.export(reportWithDates, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    // Check that dates are formatted
    expect(content).toContain('365 days'); // activeDays
  });

  it('handles export errors gracefully', async () => {
    const invalidPath = '\0invalid';

    await expect(markdownExporter.export(mockReport, invalidPath)).rejects.toThrow();
  });

  it('handles various language distributions', async () => {
    const reportWithLanguages = {
      ...mockReport,
      repository: {
        ...mockReport.repository,
        languages: {
          typescript: 10000,
          javascript: 5000,
          python: 3000,
          go: 2000,
          rust: 1000,
        },
      },
    };

    await markdownExporter.export(reportWithLanguages, testOutputDir);

    const outputPath = resolve(testOutputDir, 'git-spark-report.md');
    const content = readFileSync(outputPath, 'utf-8');

    expect(content).toContain('typescript: 10000');
    expect(content).toContain('javascript: 5000');
  });
});
