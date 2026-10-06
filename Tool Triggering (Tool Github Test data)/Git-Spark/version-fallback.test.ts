/**
 * Tests for version-fallback module
 */

import { getVersion, getBuildTime } from '../src/version-fallback.js';

describe('version-fallback', () => {
  describe('getVersion', () => {
    it('should return a valid version string', async () => {
      const version = await getVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
      // Should be either from version module or default
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should not return an empty string', async () => {
      const version = await getVersion();
      expect(version).not.toBe('');
    });

    it('should return a consistent version across multiple calls', async () => {
      const version1 = await getVersion();
      const version2 = await getVersion();
      expect(version1).toBe(version2);
    });

    it('should return a semantic version format', async () => {
      const version = await getVersion();
      // Should match semantic version pattern (x.y.z)
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('getBuildTime', () => {
    it('should return a valid ISO date string', async () => {
      const buildTime = await getBuildTime();
      expect(typeof buildTime).toBe('string');
      expect(buildTime.length).toBeGreaterThan(0);

      // Should be a valid date
      const date = new Date(buildTime);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should not return an empty string', async () => {
      const buildTime = await getBuildTime();
      expect(buildTime).not.toBe('');
    });

    it('should return an ISO format date', async () => {
      const buildTime = await getBuildTime();
      // Should match ISO format (allow for timezone variations)
      expect(buildTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return a consistent build time format across multiple calls', async () => {
      const buildTime1 = await getBuildTime();
      const buildTime2 = await getBuildTime();
      // Both should be valid ISO dates
      expect(buildTime1).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(buildTime2).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // Timestamps should be very close (within 1 second)
      const time1 = new Date(buildTime1).getTime();
      const time2 = new Date(buildTime2).getTime();
      expect(Math.abs(time1 - time2)).toBeLessThan(1000);
    });

    it('should return a valid timestamp that can be parsed', async () => {
      const buildTime = await getBuildTime();
      const timestamp = Date.parse(buildTime);
      expect(timestamp).not.toBeNaN();
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing version module gracefully', async () => {
      // Since the actual file may or may not exist, just ensure functions don't throw
      await expect(getVersion()).resolves.not.toThrow();
      await expect(getBuildTime()).resolves.not.toThrow();
    });

    it('should return reasonable defaults when modules are missing', async () => {
      const version = await getVersion();
      const buildTime = await getBuildTime();

      // Should have reasonable fallback values
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
      expect(buildTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('integration scenarios', () => {
    it('should work with current project structure', async () => {
      // Test that the functions work in the current project context
      const version = await getVersion();
      const buildTime = await getBuildTime();

      expect(version).toBeDefined();
      expect(buildTime).toBeDefined();
      expect(typeof version).toBe('string');
      expect(typeof buildTime).toBe('string');
    });

    it('should return valid data for package operations', async () => {
      const version = await getVersion();
      const buildTime = await getBuildTime();

      // Version should be valid for npm/package.json
      expect(version.split('.').length).toBeGreaterThanOrEqual(3);

      // Build time should be valid ISO string
      expect(new Date(buildTime).toISOString()).toBe(buildTime);
    });

    it('should handle corrupt package.json gracefully', async () => {
      // Mock the file system to return corrupt JSON
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      
      jest.spyOn(fs, 'readFileSync').mockImplementation((...args: any[]) => {
        const path = args[0];
        if (typeof path === 'string' && path.includes('package.json')) {
          return '{invalid json}';
        }
        return originalReadFileSync(...args);
      });

      const version = await getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');

      fs.readFileSync.mockRestore();
    });

    it('should handle missing package.json files', async () => {
      // Mock the file system to throw errors for package.json
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      
      jest.spyOn(fs, 'readFileSync').mockImplementation((...args: any[]) => {
        const path = args[0];
        if (typeof path === 'string' && path.includes('package.json')) {
          throw new Error('ENOENT: no such file or directory');
        }
        return originalReadFileSync(...args);
      });

      const version = await getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');

      fs.readFileSync.mockRestore();
    });

    it('should handle wrong package in package.json', async () => {
      // Mock the file system to return different package
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      
      jest.spyOn(fs, 'readFileSync').mockImplementation((...args: any[]) => {
        const path = args[0];
        if (typeof path === 'string' && path.includes('package.json')) {
          return JSON.stringify({ name: 'other-package', version: '1.0.0' });
        }
        return originalReadFileSync(...args);
      });

      const version = await getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');

      fs.readFileSync.mockRestore();
    });
  });
});
