# Remote MCP Server Deployment Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `crux-mcp` to support remote deployments over HTTP using Server-Sent Events (SSE) so cloud-based agents can interact with it, while preserving local `stdio` functionality.

**Architecture:** We will implement dual-mode transport. If `process.env.PORT` is present, it will boot an Express web server with SSE and HTTP endpoints to handle remote MCP connections. Otherwise, it defaults to the standard `stdio` transport.

**Tech Stack:** Node.js, TypeScript, Express, Server-Sent Events (SSE), MCP SDK.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Express and CORS dependencies**

Run: `npm install express cors`
Expected: `express` and `cors` are added to `dependencies`.

- [ ] **Step 2: Install TypeScript type definitions for Express and CORS**

Run: `npm install -D @types/express @types/cors`
Expected: `@types/express` and `@types/cors` are added to `devDependencies`.

### Task 2: Implement Dual-Mode Transport in Server

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Update imports and modify the `main` function**

Modify `src/index.ts` to include express, cors, and SSEServerTransport, and implement the dual-mode logic based on `process.env.PORT`.

```typescript
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
```

- [ ] **Step 2: Run the build to verify types and compilation**

Run: `npm run build`
Expected: Output showing successful TypeScript compilation with no errors.

- [ ] **Step 3: Commit the changes**

Run:
```bash
git add package.json package-lock.json src/index.ts
git commit -m "feat: implement dual-mode transport for HTTP/SSE and stdio"
```