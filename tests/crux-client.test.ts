// tests/crux-client.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CruxClient } from '../src/crux-client';

describe('CruxClient', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

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

  it('should correctly format request body for url', () => {
    const client = new CruxClient('test-key');
    const req = client.buildRequestBody({ url: 'https://example.com/page', metrics: ['largest_contentful_paint'] });
    expect(req).toEqual({
      url: 'https://example.com/page',
      metrics: ['largest_contentful_paint']
    });
  });

  it('should call fetch and return data in queryRecord', async () => {
    const mockData = { record: { key: { url: 'https://example.com/' } } };
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as any)
    ) as any;

    const client = new CruxClient('test-key');
    const result = await client.queryRecord({ url: 'https://example.com' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=test-key',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/' })
      })
    );
    expect(result).toEqual(mockData);

    // Verify cache is used on second call
    const result2 = await client.queryRecord({ url: 'https://example.com' });
    expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
    expect(result2).toEqual(mockData);
  });

  it('should throw on 404 from API', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 404,
        ok: false,
      } as any)
    ) as any;

    const client = new CruxClient('test-key');
    await expect(client.queryRecord({ url: 'https://notfound.example.com' })).rejects.toThrow('Insufficient real-user traffic data for this URL/Origin.');
  });

  it('should throw on other API errors', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 500,
        statusText: 'Internal Server Error',
        ok: false,
      } as any)
    ) as any;

    const client = new CruxClient('test-key');
    await expect(client.queryRecord({ url: 'https://error.example.com' })).rejects.toThrow('CrUX API Error: 500 Internal Server Error');
  });

  it('should hit rate limit after 140 requests', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any)
    ) as any;

    const client = new CruxClient('test-key');
    
    // Fill up the bucket
    for (let i = 0; i < 140; i++) {
      await client.queryRecord({ url: `https://example.com/${i}` });
    }

    // Next one should throw
    await expect(client.queryRecord({ url: 'https://example.com/141' })).rejects.toThrow('Rate limit reached, please pause and try again later');
  });

  it('should reset rate limit after 60 seconds', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any)
    ) as any;

    const client = new CruxClient('test-key');
    
    // Fill up the bucket
    for (let i = 0; i < 140; i++) {
      await client.queryRecord({ url: `https://example.com/${i}` });
    }

    // Advance time by 61 seconds
    jest.advanceTimersByTime(61000);

    // This should now succeed without throwing
    await expect(client.queryRecord({ url: 'https://example.com/141' })).resolves.toBeDefined();
    
    jest.useRealTimers();
  });
});