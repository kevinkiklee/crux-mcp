# CrUX MCP Server Design Specification
**Date**: April 9, 2026
**Topic**: Chrome UX Report (CrUX) MCP Server

## 1. Overview
The CrUX MCP Server is an official Google Chrome product that allows AI agents (Claude, Gemini, Cursor, ChatGPT, etc.) to natively query the Chrome User Experience Report. By implementing the Model Context Protocol (MCP), agents can invoke tools to fetch real-world web performance metrics (Core Web Vitals) for origins and URLs.

## 2. Architecture & Tech Stack
- **Language**: TypeScript / Node.js
- **Protocol SDK**: `@modelcontextprotocol/sdk`
- **Authentication**: User-provided `CRUX_API_KEY` via environment variables.

## 3. Tool Definitions
We will expose four specific tools to give LLMs clear boundaries and reduce hallucination:

1. `get_url_metrics`
   - **Inputs**: `url` (string), `formFactor` (enum), `metrics` (string[])
   - **Description**: Use to evaluate the performance of a *specific* page.
2. `get_origin_metrics`
   - **Inputs**: `origin` (string), `formFactor` (enum), `metrics` (string[])
   - **Description**: Use to evaluate the aggregate performance of an *entire website*.
3. `get_url_history`
   - **Inputs**: `url` (string), `formFactor` (enum), `metrics` (string[])
   - **Description**: Use to get 6-month historical data for a specific page.
4. `get_origin_history`
   - **Inputs**: `origin` (string), `formFactor` (enum), `metrics` (string[])
   - **Description**: Use to get 6-month historical data for an entire website.

*Note: Enums for `metrics` and `formFactor` will be explicitly defined in the MCP schemas (e.g., `largest_contentful_paint`, `DESKTOP`).*

## 4. Security & Privacy
- **SSRF Prevention**: All `url` and `origin` inputs will be parsed using Node's `URL` constructor. The protocol must be `https:` and the hostname must not be a local/private IP or `localhost`.
- **Credential Protection**: The `CRUX_API_KEY` will never be logged, printed to `stderr`, or echoed in API responses.

## 5. Performance & Reliability
- **In-Memory Caching**: Since CrUX data updates once daily, responses will be cached in-memory (e.g., using `node-cache`) to ensure immediate responses for repeated tool calls and save API quotas.
- **Connection Reuse**: Use HTTP Keep-Alive for requests to `chromeuxreport.googleapis.com`.
- **Local Rate Limiting**: To prevent LLM loops from exhausting the 150 req/min GCP quota, the server will implement a leaky bucket rate limiter, throwing a soft error if the agent spams the endpoint.

## 6. Output Formatting & Context Management
- **Raw JSON Output**: The server will return the raw JSON from the CrUX API.
- **Minification**: JSON will be strictly minified (`JSON.stringify(data)`) to reduce token consumption.
- **Prompt Engineering**: The tool descriptions will explicitly advise agents to only request specific `metrics` when querying the History API to avoid blowing out their context windows.
- **Graceful Error Handling**: 404s from CrUX (which mean insufficient real-user traffic) will be caught and translated into a friendly message ("Insufficient real-user traffic data for this URL").

## 7. Observability
- Logging will be strictly directed to `stderr` to prevent corrupting the `stdout` JSON-RPC stream required by MCP.