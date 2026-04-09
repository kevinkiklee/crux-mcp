# Remote MCP Server Deployment Design (Railway)

## Objective
Update the `crux-mcp` server to support remote deployments over HTTP using Server-Sent Events (SSE) so that cloud-based agents can interact with it. The solution must be easily deployable to Railway while preserving the existing local (`stdio`) functionality.

## Architecture & Transport
1. **Dual-Mode Transport:**
   - The application will inspect the environment variables on startup.
   - If a `PORT` environment variable is defined (which cloud providers like Railway inject automatically), the server will boot in **HTTP/SSE Mode**.
   - If `PORT` is not defined, it will boot in **Stdio Mode** to preserve existing compatibility with local desktop clients (Cursor, Claude Desktop).

2. **HTTP/SSE Server:**
   - An `express` web server will be introduced.
   - It will utilize the `@modelcontextprotocol/sdk/server/sse.js` module.
   - `GET /sse`: Endpoint to establish the long-lived SSE connection.
   - `POST /messages`: Endpoint to receive JSON-RPC payload requests from the remote client.

## Components & Data Flow
1. **Express Integration (`src/index.ts`):**
   - Import `express` and `cors`.
   - Setup an Express application with CORS fully enabled (allowing all origins, or configured via env).
   - Implement the `SSEServerTransport`. When a client hits `/sse`, the transport establishes the connection and binds it to the existing `Server` instance.
   - Route `POST /messages` directly into the established transport.

2. **Deployment (Railway):**
   - Add a `railway.json` configuration file (or rely on Railway's standard Node.js Nixpacks builder which uses `npm start`).
   - Add a `Procfile` if necessary, though standard `npm start` running `node build/index.js` is usually sufficient for Railway.
   - Ensure the `CRUX_API_KEY` is documented as a required environment variable for the Railway dashboard.

## Error Handling
- The existing error handling within tool execution (`try/catch` returning `isError: true`) will remain intact.
- Express will include a basic error-handling middleware to catch malformed JSON-RPC requests on the `/messages` endpoint.
- If the `CRUX_API_KEY` is missing on boot, the process will log a critical error and exit (status 1), which Railway will capture in its deployment logs.

## Testing Strategy
1. Local HTTP Test: Run `PORT=3000 npm start` and use curl or a browser to verify the `/sse` endpoint responds with a stream.
2. Local Stdio Test: Run `npm start` and ensure the process waits for standard input without crashing.
3. Build Verification: Ensure `npm run build` cleanly transpiles the new Express and CORS dependencies.
