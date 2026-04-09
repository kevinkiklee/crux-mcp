# CrUX API Findings

## Overview
The Chrome User Experience Report (CrUX) API provides low-latency access to aggregated, real-user experience data from Chrome users. It reports core web vitals and other performance metrics at both the page (`url`) and site (`origin`) level.

## Key APIs
1. **CrUX API**: `POST https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=[YOUR_API_KEY]`
   - **Inputs**: `url` OR `origin`, `formFactor` (DESKTOP, PHONE, TABLET), `metrics` (array of metrics).
   - **Outputs**: Histograms and percentiles (like p75) for metrics such as `cumulative_layout_shift` (CLS), `first_contentful_paint` (FCP), `largest_contentful_paint` (LCP), and `interaction_to_next_paint` (INP).
   - **Rate Limit**: 150 queries per minute per GCP project.

2. **CrUX History API**: Provides historical time-series data of these same metrics over time.

## Application to AI Agents
Building an MCP (Model Context Protocol) Server for CrUX will allow AI agents to invoke a tool (e.g., `get_crux_metrics(url: string)`) and receive structured performance data. 

**Is there a better approach than MCP?**
No. Since you want to support a wide range of agents (Claude, Gemini, Cursor, ChatGPT, etc.), MCP is the exact industry standard designed for this. Writing custom plugins for each individual AI platform would be significantly more overhead. An MCP server provides a single, unified interface that any MCP-compatible agent can consume.

## Initial Thoughts for the MCP Server
- We should expose two primary tools: `get_crux_metrics` and `get_crux_history`.
- The server will require users to provide their own `CRUX_API_KEY` via environment variables.
- The standard MCP SDKs are available in TypeScript and Python. Given that this is a Chrome DevRel product, TypeScript/Node.js might align better with the web performance ecosystem.
