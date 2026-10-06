import { GitSpark, analyze, exportReport } from '../src/index.js';
import { GitSparkOptions, AnalysisReport, OutputFormat } from '../src/types/index.js';
import * as process from 'process';

// Mock the output modules to avoid file system operations
jest.mock('../src/output/html', () => ({
  HTMLExporter: jest.fn().mockImplementation(() => ({
    export: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../src/output/json', () => ({
  JSONExporter: jest.fn().mockImplementation(() => ({
    export: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../src/output/markdown', () => ({
  MarkdownExporter: jest.fn().mockImplementation(() => ({
    export: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../src/output/csv', () => ({
  CSVExporter: jest.fn().mockImplementation(() => ({
    export: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../src/output/console', () => ({
  ConsoleExporter: jest.fn().mockImplementation(() => ({
    export: jest.fn().mockReturnValue(undefined),
  })),
}));

describe('GitSpark', () => {
  const testOptions: GitSparkOptions = {
    repoPath: process.cwd(),
    days: 30,
    format: 'json',
  };

  describe('constructor', () => {
    it('should create a GitSpark instance with valid options', () => {
      expect(() => new GitSpark(testOptions)).not.toThrow();
    });

    it('should throw error with invalid options', () => {
      const invalidOptions: GitSparkOptions = {
        repoPath: '/nonexistent/path',
      };

      expect(() => new GitSpark(invalidOptions)).toThrow();
    });

    it('should accept progress callback', () => {
      const progressCallback = jest.fn();
      expect(() => new GitSpark(testOptions, progressCallback)).not.toThrow();
    });
  });

  describe('analyze', () => {
    it('should perform analysis and return report', async () => {
      const gitSpark = new GitSpark(testOptions);
      const report = await gitSpark.analyze();

      expect(report).toBeDefined();
      expect(report.metadata).toBeDefined();
      expect(report.repository).toBeDefined();
      expect(report.authors).toBeDefined();
      expect(report.files).toBeDefined();
      expect(Array.isArray(report.authors)).toBe(true);
      expect(Array.isArray(report.files)).toBe(true);
    }, 30000); // 30 second timeout for analysis
  });

  describe('export', () => {
    let gitSpark: GitSpark;

    beforeEach(() => {
      gitSpark = new GitSpark({ repoPath: process.cwd(), days: 7 });
    });

    it('should export using a provided report without reanalysis', async () => {
      const report = await gitSpark.analyze();
      const analyzeSpy = jest.spyOn(gitSpark, 'analyze');

      await expect(gitSpark.export('json', './test-output', report)).resolves.not.toThrow();
      expect(analyzeSpy).not.toHaveBeenCalled();

      analyzeSpy.mockRestore();
    }, 15000);

    it('should export HTML format', async () => {
      await expect(gitSpark.export('html', './test-output')).resolves.not.toThrow();
    }, 15000);

    it('should export JSON format', async () => {
      await expect(gitSpark.export('json', './test-output')).resolves.not.toThrow();
    }, 15000);

    it('should export Markdown format', async () => {
      await expect(gitSpark.export('markdown', './test-output')).resolves.not.toThrow();
    }, 15000);

    it('should export CSV format', async () => {
      await expect(gitSpark.export('csv', './test-output')).resolves.not.toThrow();
    }, 15000);

    it('should export Console format', async () => {
      await expect(gitSpark.export('console', './test-output')).resolves.not.toThrow();
    }, 15000);

    it('should throw error for unsupported format', async () => {
      await expect(gitSpark.export('unsupported' as OutputFormat, './test-output')).rejects.toThrow(
        'Unsupported format: unsupported'
      );
    });
  });

  describe('error handling', () => {
    it('should handle invalid repository path', () => {
      expect(() => new GitSpark({ repoPath: '/nonexistent/path' })).toThrow();
    });

    it('should validate options properly', () => {
      // Test nonexistent path should throw
      expect(() => new GitSpark({ repoPath: '/nonexistent/path' })).toThrow();

      // Test valid path should not throw
      expect(() => new GitSpark({ repoPath: process.cwd() })).not.toThrow();

      // Test empty path should not throw (uses process.cwd())
      expect(() => new GitSpark({ repoPath: '' })).not.toThrow();
    });
  });

  describe('quick analyze function', () => {
    it('should perform quick analysis with default path', async () => {
      const report = await analyze(undefined, { days: 7 });

      expect(report).toBeDefined();
      expect(report.repository).toBeDefined();
      expect(typeof report.repository.totalCommits).toBe('number');
    }, 15000);

    it('should perform quick analysis with custom path', async () => {
      const report = await analyze(process.cwd(), { days: 7 });

      expect(report).toBeDefined();
      expect(report.repository).toBeDefined();
      expect(typeof report.repository.totalCommits).toBe('number');
    }, 15000);

    it('should perform quick analysis with custom options', async () => {
      const recentSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const report = await analyze(process.cwd(), {
        days: 7,
        format: 'json',
        since: recentSince,
      });

      expect(report).toBeDefined();
      expect(report.repository).toBeDefined();
    }, 15000);
  });
});

describe('GitSpark configuration', () => {
  it('should have valid default configuration', () => {
    const config = GitSpark.getDefaultConfig();

    expect(config.version).toBe('1.0');
    expect(config.analysis.excludePaths).toContain('node_modules/**');
    expect(config.output.defaultFormat).toBe('html');
    expect(config.performance.enableCaching).toBe(true);
  });

  it('should have complete configuration structure', () => {
    const config = GitSpark.getDefaultConfig();

    // Analysis configuration
    expect(config.analysis).toBeDefined();
    expect(config.analysis.thresholds).toBeDefined();
    expect(config.analysis.weights).toBeDefined();
    expect(config.analysis.weights.risk).toBeDefined();
    expect(config.analysis.weights.governance).toBeDefined();

    // Output configuration
    expect(config.output).toBeDefined();
    expect(config.output.includeCharts).toBe(true);
    expect(config.output.redactEmails).toBe(false);
    expect(config.output.theme).toBe('default');

    // Performance configuration
    expect(config.performance).toBeDefined();
    expect(config.performance.maxBuffer).toBe(200);
    expect(config.performance.cacheDir).toBe('.git-spark-cache');
    expect(config.performance.chunkSize).toBe(1000);
  });

  it('should have proper threshold values', () => {
    const config = GitSpark.getDefaultConfig();
    const thresholds = config.analysis.thresholds;

    expect(thresholds.largeCommitLines).toBe(500);
    expect(thresholds.smallCommitLines).toBe(50);
    expect(thresholds.staleBranchDays).toBe(30);
    expect(thresholds.largeFileKB).toBe(300);
    expect(thresholds.hotspotAuthorThreshold).toBe(3);
  });

  it('should have proper weight values that sum correctly', () => {
    const config = GitSpark.getDefaultConfig();
    const riskWeights = config.analysis.weights.risk;
    const govWeights = config.analysis.weights.governance;

    // Risk weights should sum to 1.0
    const riskSum = Object.values(riskWeights).reduce((a, b) => a + b, 0);
    expect(riskSum).toBeCloseTo(1.0);

    // Governance weights should sum to 1.0
    const govSum = Object.values(govWeights).reduce((a, b) => a + b, 0);
    expect(govSum).toBeCloseTo(1.0);
  });
});

describe('exportReport function', () => {
  const mockReport: AnalysisReport = {
    metadata: {
      generatedAt: new Date(),
      version: '1.0.0',
      repoPath: '/test/repo',
      analysisOptions: { repoPath: '/test/repo' },
      processingTime: 1000,
      gitVersion: '2.44.0',
      commit: 'abc123',
      branch: 'main',
    },
    repository: {
      totalCommits: 100,
      totalAuthors: 5,
      totalFiles: 50,
      totalChurn: 1500,
      firstCommit: new Date('2024-01-01'),
      lastCommit: new Date(),
      activeDays: 30,
      avgCommitsPerDay: 3.33,
      languages: { TypeScript: 80, JavaScript: 20 },
      busFactor: 3,
      healthScore: 85,
      governanceScore: 80,
    },
    currentState: {
      totalFiles: 50,
      totalSizeBytes: 1024000,
      byExtension: [
        {
          extension: 'ts',
          language: 'TypeScript',
          fileCount: 30,
          totalSizeBytes: 600000,
          percentage: 60,
          averageFileSize: 20000,
        },
        {
          extension: 'js',
          language: 'JavaScript',
          fileCount: 15,
          totalSizeBytes: 300000,
          percentage: 30,
          averageFileSize: 20000,
        },
        {
          extension: 'json',
          language: 'JSON',
          fileCount: 5,
          totalSizeBytes: 124000,
          percentage: 10,
          averageFileSize: 24800,
        },
      ],
      categories: {
        sourceCode: { fileCount: 45, totalSizeBytes: 900000, percentage: 90 },
        documentation: { fileCount: 3, totalSizeBytes: 75000, percentage: 6 },
        configuration: { fileCount: 2, totalSizeBytes: 49000, percentage: 4 },
        tests: { fileCount: 0, totalSizeBytes: 0, percentage: 0 },
        other: { fileCount: 0, totalSizeBytes: 0, percentage: 0 },
      },
      topDirectories: [
        { path: 'src', fileCount: 45, percentage: 90 },
        { path: 'docs', fileCount: 3, percentage: 6 },
        { path: '(root)', fileCount: 2, percentage: 4 },
      ],
      analyzedAt: new Date(),
    },
    timeline: [],
    authors: [],
    files: [],
    hotspots: [],
    risks: {
      highRiskFiles: [],
      riskFactors: {},
      recommendations: [],
      overallRisk: 'low',
    },
    governance: {
      conventionalCommits: 75,
      traceabilityScore: 80,
      avgMessageLength: 50,
      wipCommits: 5,
      revertCommits: 2,
      shortMessages: 10,
      score: 80,
      recommendations: [],
    },
    teamScore: {
      overall: 78,
      collaboration: {
        score: 80,
        crossTeamInteraction: 72,
        knowledgeDistribution: 68,
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
          multiContributorDays: 18,
          soloContributorDays: 12,
          coveragePercentage: 60,
          note: 'Measures daily contributor diversity, not vacation coverage',
        },
        limitations: {
          timezoneWarning: 'Commit timestamps may not reflect actual work hours',
          workPatternNote: 'Git commits ≠ work hours',
          burnoutDetection: 'Cannot accurately assess burnout from Git data alone',
          recommendedApproach: 'Use for general patterns only',
          knownLimitations: ['Timezone issues', 'CI commits not distinguished'],
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
      keyMetrics: { 'Total Commits': 100, 'Active Authors': 5 },
      insights: ['Good commit frequency'],
      actionItems: ['Improve test coverage'],
    },
  };

  it('exports exportReport function', () => {
    expect(typeof exportReport).toBe('function');
  });

  it('returns a promise', () => {
    const result = exportReport(mockReport, 'json', './test-output');
    expect(result).toBeInstanceOf(Promise);

    // Clean up the promise
    result.catch(() => {}); // Ignore errors since this is just a type test
  });

  it('successfully exports HTML format', async () => {
    await expect(exportReport(mockReport, 'html', './test-output')).resolves.not.toThrow();
  });

  it('successfully exports JSON format', async () => {
    await expect(exportReport(mockReport, 'json', './test-output')).resolves.not.toThrow();
  });

  it('rejects unsupported formats in quick export', async () => {
    await expect(exportReport(mockReport, 'markdown', './test-output')).rejects.toThrow(
      'Format markdown not supported in quick export'
    );

    await expect(exportReport(mockReport, 'csv', './test-output')).rejects.toThrow(
      'Format csv not supported in quick export'
    );

    await expect(exportReport(mockReport, 'console', './test-output')).rejects.toThrow(
      'Format console not supported in quick export'
    );
  });

  it('accepts different output path formats', async () => {
    await expect(exportReport(mockReport, 'json', './custom-output')).resolves.not.toThrow();
    await expect(exportReport(mockReport, 'json', '/absolute/path')).resolves.not.toThrow();
    await expect(exportReport(mockReport, 'html', 'relative/path')).resolves.not.toThrow();
  });

  it('handles empty paths', async () => {
    await expect(exportReport(mockReport, 'json', '')).resolves.not.toThrow();
  });
});

// Test module exports
describe('Module exports', () => {
  it('exports main GitSpark class', () => {
    expect(GitSpark).toBeDefined();
    expect(typeof GitSpark).toBe('function');
  });

  it('exports analyze function', () => {
    expect(analyze).toBeDefined();
    expect(typeof analyze).toBe('function');
  });

  it('exports exportReport function', () => {
    expect(exportReport).toBeDefined();
    expect(typeof exportReport).toBe('function');
  });
});

// Test option handling edge cases
describe('Option handling', () => {
  it('should handle minimal options', () => {
    expect(() => new GitSpark({ repoPath: process.cwd() })).not.toThrow();
  });

  it('should handle options with all fields', () => {
    const completeOptions: GitSparkOptions = {
      repoPath: process.cwd(),
      days: 30,
      since: '2024-01-01',
      until: '2024-12-31',
      format: 'html',
      author: 'test@example.com',
      branch: 'main',
      path: 'src/',
      redactEmails: true,
      heavy: false,
    };

    expect(() => new GitSpark(completeOptions)).not.toThrow();
  });
});
