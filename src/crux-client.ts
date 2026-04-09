// src/crux-client.ts
import NodeCache from 'node-cache';
import { validateAndSanitizeUrl } from './utils';

export interface CruxQuery {
  url?: string;
  origin?: string;
  formFactor?: string;
  metrics?: string[];
}

export class CruxClient {
  private cache: NodeCache;
  private apiKey: string;
  private requestCount: number = 0;
  private lastRequestTime: number = Date.now();

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('API key is required');
    this.apiKey = apiKey;
    this.cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
  }

  buildRequestBody(query: CruxQuery): any {
    const body: any = {};
    if (query.origin) {
      body.origin = validateAndSanitizeUrl(query.origin).origin;
    } else if (query.url) {
      body.url = validateAndSanitizeUrl(query.url).href;
    }
    
    if (query.formFactor) body.formFactor = query.formFactor;
    if (query.metrics && query.metrics.length > 0) body.metrics = query.metrics;
    return body;
  }

  async queryRecord(query: CruxQuery, history: boolean = false): Promise<any> {
    const body = this.buildRequestBody(query);
    const cacheKey = `${history ? 'hist' : 'curr'}:${JSON.stringify(body)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Simple leaky bucket rate limiter
    const now = Date.now();
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    if (this.requestCount >= 140) {
      throw new Error('Rate limit reached, please pause and try again later');
    }
    this.requestCount++;

    const endpoint = history ? 'queryHistoryRecord' : 'queryRecord';
    const res = await fetch(`https://chromeuxreport.googleapis.com/v1/records:${endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.status === 404) {
      throw new Error('Insufficient real-user traffic data for this URL/Origin.');
    }
    if (!res.ok) {
      throw new Error(`CrUX API Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    this.cache.set(cacheKey, data);
    return data;
  }
}