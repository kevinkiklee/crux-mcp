#!/usr/bin/env node
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { CruxClient } from './crux-client';
import { tools, parseToolArgs } from './tools';

const API_KEY = process.env.CRUX_API_KEY;
if (!API_KEY) {
  console.error("Error: CRUX_API_KEY environment variable is required.");
  process.exit(1);
}

const client = new CruxClient(API_KEY);
const server = new Server({ name: 'crux-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    const parsedArgs = parseToolArgs(name, args);
    const isHistory = name.includes('history');
    
    const data = await client.queryRecord(parsedArgs, isHistory);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(data) }],
      isError: false
    };
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true
    };
  }
});

async function main() {
  const port = process.env.PORT;

  if (port) {
    // HTTP/SSE Mode
    const app = express();
    app.use(cors());

    let sseTransport: SSEServerTransport | null = null;

    app.get('/sse', async (req, res) => {
      sseTransport = new SSEServerTransport('/messages', res);
      await server.connect(sseTransport);
    });

    app.post('/messages', async (req, res) => {
      if (sseTransport) {
        await sseTransport.handlePostMessage(req, res);
      } else {
        res.status(400).send('No active SSE connection');
      }
    });

    app.listen(port, () => {
      console.error(`CrUX MCP Server running on HTTP/SSE at port ${port}`);
    });
  } else {
    // Stdio Mode
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("CrUX MCP Server running on stdio");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
