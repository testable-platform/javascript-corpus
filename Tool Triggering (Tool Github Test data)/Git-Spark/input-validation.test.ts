/**
 * Tests for input validation utilities
 * These tests ensure that command injection vulnerabilities are prevented
 */

import {
  validateDateString,
  validateAuthorString,
  validateNumericString,
  validatePathString,
  validateBranchString,
  validateGitOptions,
} from '../src/utils/input-validation.js';

describe('Input Validation', () => {
  describe('validateDateString', () => {
    it('should accept valid date formats', () => {
      const validDates = [
        '2024-01-01',
        '2024-12-31T23:59:59Z',
        '2024-06-15T10:30:00.123Z',
        '2023-01-01 12:00:00',
        '1 week ago',
        '2 months ago',
        '1 year ago',
      ];

      validDates.forEach(date => {
        const result = validateDateString(date);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    it('should reject dangerous input patterns', () => {
      const dangerousInputs = [
        '2023-01-01; rm -rf /',
        '2023-01-01`touch /tmp/pwned`',
        '2023-01-01$(whoami)',
        '2023-01-01 && echo "hacked"',
        '2023-01-01|cat /etc/passwd',
        '2023-01-01{evil}',
      ];

      dangerousInputs.forEach(input => {
        const result = validateDateString(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('contains invalid characters');
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        'not-a-date',
        '2023/01/01', // Wrong separator
        '01-01-2023', // Wrong order
        '2023-13-01', // Invalid month
        '',
        '2023-01-01T25:00:00Z', // Invalid hour
      ];

      invalidDates.forEach(date => {
        const result = validateDateString(date);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validateAuthorString', () => {
    it('should accept valid author formats', () => {
      const validAuthors = [
        'John Doe',
        'john@example.com',
        'John Doe <john@example.com>',
        'jane.smith@company.co.uk',
        'User Name <user.name+tag@domain.com>',
      ];

      validAuthors.forEach(author => {
        const result = validateAuthorString(author);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    it('should reject dangerous input patterns', () => {
      const dangerousInputs = [
        'John; rm -rf /',
        'John`touch /tmp/pwned`',
        'John$(whoami)',
        'John && echo "hacked"',
        'John|cat /etc/passwd',
        'John{evil}',
      ];

      dangerousInputs.forEach(input => {
        const result = validateAuthorString(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('contains invalid characters');
      });
    });

    it('should reject malformed email addresses', () => {
      const invalidAuthors = [
        'John <invalid-email>',
        'John <@domain.com>',
        'John <user@>',
        'John <>',
        '<>',
        '',
      ];

      invalidAuthors.forEach(author => {
        const result = validateAuthorString(author);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validateNumericString', () => {
    it('should accept valid numbers', () => {
      const validNumbers = ['100', '0', '999999', 100, 0, 999999];

      validNumbers.forEach(num => {
        const result = validateNumericString(num);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    it('should reject dangerous input patterns', () => {
      const dangerousInputs = [
        '100; rm -rf /',
        '100`touch /tmp/pwned`',
        '100$(whoami)',
        '100 && echo "hacked"',
        '100|cat /etc/passwd',
        '100{evil}',
      ];

      dangerousInputs.forEach(input => {
        const result = validateNumericString(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('contains invalid characters');
      });
    });

    it('should reject invalid numbers', () => {
      const invalidNumbers = [
        'not-a-number',
        '100.5',
        '-100',
        '1000001', // Too large
        '',
        'NaN',
        'Infinity',
      ];

      invalidNumbers.forEach(num => {
        const result = validateNumericString(num);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validatePathString', () => {
    it('should accept valid paths', () => {
      const validPaths = [
        'src/file.ts',
        './relative/path',
        'folder/subfolder/file.txt',
        'file.js',
        'path/with-dashes/file_name.ext',
      ];

      validPaths.forEach(path => {
        const result = validatePathString(path);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    it('should reject dangerous input patterns', () => {
      const dangerousInputs = [
        'file.txt; rm -rf /',
        'file.txt`touch /tmp/pwned`',
        'file.txt$(whoami)',
        'file.txt && echo "hacked"',
        'file.txt|cat /etc/passwd',
        'file.txt{evil}',
        '../../../etc/passwd',
        'path//with//double//slashes',
      ];

      dangerousInputs.forEach(input => {
        const result = validatePathString(input);
        expect(result.isValid).toBe(false);
        if (input.includes('..')) {
          expect(result.error).toContain('directory traversal');
        }
      });
    });
  });

  describe('validateBranchString', () => {
    it('should accept valid branch names', () => {
      const validBranches = [
        'main',
        'feature/new-feature',
        'bugfix/issue-123',
        'release/v1.0.0',
        'develop',
        'hotfix/urgent-fix',
      ];

      validBranches.forEach(branch => {
        const result = validateBranchString(branch);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    it('should reject dangerous input patterns', () => {
      const dangerousInputs = [
        'branch; rm -rf /',
        'branch`touch /tmp/pwned`',
        'branch$(whoami)',
        'branch && echo "hacked"',
        'branch|cat /etc/passwd',
        'branch{evil}',
      ];

      dangerousInputs.forEach(input => {
        const result = validateBranchString(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('contains invalid characters');
      });
    });

    it('should reject invalid branch names according to Git rules', () => {
      const invalidBranches = [
        '-invalid-start',
        'branch with spaces',
        'branch..double-dot',
        'branch~with~tilde',
        'branch^with^caret',
        'branch:with:colon',
        '', // Empty string
      ];

      invalidBranches.forEach(branch => {
        const result = validateBranchString(branch);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validateGitOptions', () => {
    it('should validate all options successfully', () => {
      const validOptions = {
        since: '2023-01-01',
        until: '2023-12-31',
        author: 'John Doe <john@example.com>',
        maxCount: 100,
        branch: 'main',
        path: 'src/file.ts',
      };

      const result = validateGitOptions(validOptions);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const invalidOptions = {
        since: 'invalid-date; rm -rf /',
        until: 'another-invalid-date`evil`',
        author: 'Bad Author $(whoami)',
        maxCount: 'not-a-number && echo hacked',
        branch: 'bad branch name',
        path: '../../../etc/passwd',
      };

      const result = validateGitOptions(invalidOptions);
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);

      // Check that each field has an error
      expect(result.errors.some(err => err.startsWith('since:'))).toBe(true);
      expect(result.errors.some(err => err.startsWith('until:'))).toBe(true);
      expect(result.errors.some(err => err.startsWith('author:'))).toBe(true);
      expect(result.errors.some(err => err.startsWith('maxCount:'))).toBe(true);
      expect(result.errors.some(err => err.startsWith('branch:'))).toBe(true);
      expect(result.errors.some(err => err.startsWith('path:'))).toBe(true);
    });

    it('should handle partial options', () => {
      const partialOptions = {
        since: '2023-01-01',
        author: 'John Doe',
      };

      const result = validateGitOptions(partialOptions);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized!.since).toBe('2023-01-01');
      expect(result.sanitized!.author).toBe('John Doe');
      expect(result.sanitized!.until).toBeUndefined();
      expect(result.sanitized!.branch).toBeUndefined();
    });

    it('should handle empty options', () => {
      const result = validateGitOptions({});
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Security Test Cases', () => {
    it('should prevent command injection through shell metacharacters', () => {
      const maliciousInputs = [
        '; rm -rf /',
        '`rm -rf /`',
        '$(rm -rf /)',
        '&& rm -rf /',
        '|| rm -rf /',
        '| cat /etc/passwd',
        '> /tmp/pwned',
        '< /etc/passwd',
        '{ evil: command }',
        '[ evil command ]',
        '\n rm -rf /',
        '\r rm -rf /',
        '\t rm -rf /',
      ];

      maliciousInputs.forEach(malicious => {
        // Test in different contexts
        expect(validateDateString(`2023-01-01${malicious}`).isValid).toBe(false);
        expect(validateAuthorString(`user${malicious}`).isValid).toBe(false);
        expect(validateBranchString(`branch${malicious}`).isValid).toBe(false);
        expect(validatePathString(`path${malicious}`).isValid).toBe(false);
      });
    });

    it('should prevent path traversal attacks', () => {
      const pathTraversalInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'normal/../../../etc/passwd',
        'path/../../sensitive/file',
        './.././../etc/passwd',
      ];

      pathTraversalInputs.forEach(input => {
        expect(validatePathString(input).isValid).toBe(false);
      });
    });

    it('should prevent null byte injection', () => {
      const nullByteInputs = [
        'file.txt\x00.evil',
        'user\x00; rm -rf /',
        'branch\x00`evil`',
        '2023-01-01\x00$(whoami)',
      ];

      nullByteInputs.forEach(input => {
        expect(validateDateString(input).isValid).toBe(false);
        expect(validateAuthorString(input).isValid).toBe(false);
        expect(validateBranchString(input).isValid).toBe(false);
        expect(validatePathString(input).isValid).toBe(false);
      });
    });
  });
});
