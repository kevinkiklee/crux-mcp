import { z } from 'zod';

const FormFactorSchema = z.enum(['DESKTOP', 'PHONE', 'TABLET']);
const MetricsSchema = z.enum([
  'cumulative_layout_shift', 'first_contentful_paint', 'interaction_to_next_paint',
  'largest_contentful_paint', 'experimental_time_to_first_byte', 'largest_contentful_paint_resource_type',
  'navigation_types', 'round_trip_time'
]);

const BaseSchema = z.object({
  formFactor: FormFactorSchema.optional(),
  metrics: z.array(MetricsSchema).optional()
});

export const UrlQuerySchema = BaseSchema.extend({ url: z.string().url() });
export const OriginQuerySchema = BaseSchema.extend({ origin: z.string().url() });

export const tools = [
  {
    name: 'get_url_metrics',
    description: 'Use to evaluate the performance of a specific page.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        formFactor: { type: 'string', enum: ['DESKTOP', 'PHONE', 'TABLET'] },
        metrics: { type: 'array', items: { type: 'string' } }
      },
      required: ['url']
    }
  },
  {
    name: 'get_origin_metrics',
    description: 'Use to evaluate the aggregate performance of an entire website.',
    inputSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string' },
        formFactor: { type: 'string', enum: ['DESKTOP', 'PHONE', 'TABLET'] },
        metrics: { type: 'array', items: { type: 'string' } }
      },
      required: ['origin']
    }
  },
  {
    name: 'get_url_history',
    description: 'Use to get 6-month historical data for a specific page. TIP: Request only 1-2 specific metrics to avoid token limits.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        formFactor: { type: 'string', enum: ['DESKTOP', 'PHONE', 'TABLET'] },
        metrics: { type: 'array', items: { type: 'string' } }
      },
      required: ['url']
    }
  },
  {
    name: 'get_origin_history',
    description: 'Use to get 6-month historical data for an entire website. TIP: Request only 1-2 specific metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string' },
        formFactor: { type: 'string', enum: ['DESKTOP', 'PHONE', 'TABLET'] },
        metrics: { type: 'array', items: { type: 'string' } }
      },
      required: ['origin']
    }
  }
];

export function parseToolArgs(name: string, args: any): any {
  if (name.includes('url')) {
    return UrlQuerySchema.parse(args);
  } else if (name.includes('origin')) {
    return OriginQuerySchema.parse(args);
  }
  throw new Error(`Unknown tool: ${name}`);
}
