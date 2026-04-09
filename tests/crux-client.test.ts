// tests/crux-client.test.ts
import { describe, it, expect } from '@jest/globals';
import { CruxClient } from '../src/crux-client';

describe('CruxClient', () => {
  it('should throw if no API key is provided', () => {
    expect(() => new CruxClient('')).toThrow('API key is required');
  });

  it('should correctly format request body for origin', () => {
    const client = new CruxClient('test-key');
    const req = client.buildRequestBody({ origin: 'https://example.com', formFactor: 'DESKTOP' });
    expect(req).toEqual({
      origin: 'https://example.com',
      formFactor: 'DESKTOP'
    });
  });
});