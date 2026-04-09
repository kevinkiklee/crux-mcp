import { describe, it, expect } from '@jest/globals';
import { parseToolArgs } from '../src/tools';

describe('Tool Validation', () => {
  it('should validate get_url_metrics args', () => {
    const args = { url: 'https://example.com' };
    const parsed = parseToolArgs('get_url_metrics', args);
    expect(parsed.url).toBe('https://example.com');
  });

  it('should throw on invalid metric', () => {
    const args = { url: 'https://example.com', metrics: ['invalid_metric'] };
    expect(() => parseToolArgs('get_url_metrics', args)).toThrow();
  });
});
