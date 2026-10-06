import { createLogger, setGlobalLogLevel } from '../src/utils/logger.js';

// Simplified console mocking that bypasses the TypeScript issue
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Replace console methods temporarily
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};

describe('Logger Coverage Tests', () => {
  beforeEach(() => {
    // Replace console methods
    (console as any).log = mockConsole.log;
    (console as any).error = mockConsole.error;
    (console as any).warn = mockConsole.warn;

    // Clear previous calls
    mockConsole.log.mockClear();
    mockConsole.error.mockClear();
    mockConsole.warn.mockClear();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  describe('Logger creation and reuse', () => {
    it('should create and reuse logger instances', () => {
      const logger1 = createLogger('test-module');
      const logger2 = createLogger('test-module');
      const logger3 = createLogger('different-module');

      expect(logger1).toBe(logger2); // Same module should reuse
      expect(logger1).not.toBe(logger3); // Different module should be different
    });
  });

  describe('Log level filtering', () => {
    it('should filter debug and verbose when level is info', () => {
      const logger = createLogger('filter-test');
      logger.setLevel('info');

      logger.debug('debug message');
      logger.verbose('verbose message');
      logger.info('info message');

      // Only info should be logged
      expect(mockConsole.log).toHaveBeenCalledTimes(1);
    });

    it('should show all messages at verbose level', () => {
      const logger = createLogger('verbose-test');
      logger.setLevel('verbose');

      logger.error('error');
      logger.warn('warn');
      logger.info('info');
      logger.debug('debug');
      logger.verbose('verbose');

      expect(mockConsole.log).toHaveBeenCalledTimes(3); // info, debug, verbose go to console.log
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Global log level', () => {
    it('should set level for all existing loggers', () => {
      const logger1 = createLogger('global-1');
      const logger2 = createLogger('global-2');

      // Set to error level globally
      setGlobalLogLevel('error');

      logger1.info('should not log');
      logger2.warn('should not log');
      logger1.error('should log');

      expect(mockConsole.log).toHaveBeenCalledTimes(0); // Only error goes to console.error, not console.log
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it('should only affect existing loggers, not new ones', () => {
      setGlobalLogLevel('error');
      const newLogger = createLogger('new-logger');

      // New logger should start with default 'info' level, not the global 'error' level
      newLogger.info('should log since new logger has default info level');
      newLogger.error('should also log');

      expect(mockConsole.log).toHaveBeenCalledTimes(1); // info message logs
      expect(mockConsole.error).toHaveBeenCalledTimes(1); // error message logs
    });
  });

  describe('Output formatting with metadata', () => {
    it('should include metadata in output when provided', () => {
      const logger = createLogger('metadata-test');
      logger.setLevel('info');

      const metadata = { key: 'value', count: 42 };
      logger.info('test message', metadata);

      expect(mockConsole.log).toHaveBeenCalledTimes(1);
      const call = mockConsole.log.mock.calls[0][0];
      expect(call).toContain('test message');
      expect(call).toContain(JSON.stringify(metadata));
    });

    it('should format output correctly without metadata', () => {
      const logger = createLogger('format-test');
      logger.setLevel('info');

      logger.info('simple message');

      expect(mockConsole.log).toHaveBeenCalledTimes(1);
      const call = mockConsole.log.mock.calls[0][0];
      expect(call).toContain('INFO');
      expect(call).toContain('[format-test ]');
      expect(call).toContain('simple message');
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp
    });
  });
});
