import { describe, it, expect } from '@jest/globals';
import { validateAndSanitizeUrl } from '../src/utils';

describe('URL Utils', () => {
  it('should accept valid public URLs', () => {
    expect(validateAndSanitizeUrl('https://example.com/path').href).toBe('https://example.com/path');
  });

  it('should reject non-https URLs', () => {
    expect(() => validateAndSanitizeUrl('http://example.com')).toThrow('Must be https');
  });

  it('should reject localhost and private IPs', () => {
    expect(() => validateAndSanitizeUrl('https://localhost')).toThrow('Invalid host');
    expect(() => validateAndSanitizeUrl('https://127.0.0.1')).toThrow('Invalid host');
    expect(() => validateAndSanitizeUrl('https://169.254.169.254')).toThrow('Invalid host');
  });
});
