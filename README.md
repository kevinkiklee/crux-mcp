# crux-mcp

An MCP (Model Context Protocol) server for the [Chrome UX Report (CrUX) API](https://developer.chrome.com/docs/crux/api). This server allows your AI coding agents, editors, and chat interfaces to retrieve real-world performance metrics (Core Web Vitals) for specific URLs and origins.

## Requirements

You must obtain a CrUX API Key from the Google Cloud Console. Provide it to the server via the `CRUX_API_KEY` environment variable.

### How to get a CrUX API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Library** and search for **Chrome UX Report API**.
4. Click **Enable** to enable the API for your project.
5. Go to **APIs & Services > Credentials**.
6. Click **+ Create Credentials** and select **API key**.
7. *Important:* It is highly recommended to click **Edit API key**, scroll down to **API restrictions**, select **Restrict key**, and choose the **Chrome UX Report API** to scope your key securely.
8. Copy the generated API key.

---

## Installation

### Automated Installation (CLI Agents)

**Gemini CLI**
```bash
gemini mcp add crux-mcp npx -y crux-mcp -e CRUX_API_KEY="YOUR_CRUX_API_KEY"
```

**Claude Code**
```bash
claude mcp add crux-mcp npx -y crux-mcp
# Claude Code will prompt you to configure any required environment variables.
```

### Manual Configuration (Editors & Desktop Apps)

#### Claude Desktop

Add the following to your `claude_desktop_config.json` (usually found at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "crux-mcp": {
      "command": "npx",
      "args": ["-y", "crux-mcp"],
      "env": {
        "CRUX_API_KEY": "YOUR_CRUX_API_KEY"
      }
    }
  }
}
```

*Note: If running from source locally, change the command to `node` and args to the absolute path of `build/index.js`.*

#### Cursor

*(Note: Cursor currently requires manual GUI configuration and does not support automated CLI installation)*

1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Navigate to **Features** > **MCP Servers**
3. Click **+ Add new MCP server**
4. Configure the server:
   - **Type**: `command`
   - **Name**: `crux-mcp`
   - **Command**: `npx -y crux-mcp` (or point to your local build path)
   - **Environment Variables**: Add `CRUX_API_KEY` with your API key value.
5. Click **Save** and wait for the connection indicator to show it's active.

#### Windsurf

Add the following configuration to your `~/.windsurf/mcp_config.json` file:

```json
{
  "mcpServers": {
    "crux-mcp": {
      "command": "npx",
      "args": ["-y", "crux-mcp"],
      "env": {
        "CRUX_API_KEY": "YOUR_CRUX_API_KEY"
      }
    }
  }
}
```

Restart Windsurf for the changes to take effect.

---

## Local Development

If you'd like to build and run this server from the source code:

1. Clone the repository and navigate into it.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript files:
   ```bash
   npm run build
   ```
4. Run the server locally (or configure your MCP client to point to this local build):
   ```bash
   CRUX_API_KEY="YOUR_CRUX_API_KEY" npm start
   ```

### Adding Local Build to CLI Agents

If you are developing locally and want to test the server with your CLI agents, use the local `build/index.js` path instead of `npx`:

**Gemini CLI**
```bash
gemini mcp add -e CRUX_API_KEY="YOUR_CRUX_API_KEY" crux-mcp node $(pwd)/build/index.js
```

**Claude Code**
```bash
claude mcp add crux-mcp node $(pwd)/build/index.js
```

## Available Tools

The server provides the following tools to interact with the CrUX API:

- **`get_url_metrics`**: Evaluate the performance of a specific page.
  - Required params: `url`
  - Optional params: `formFactor` (`DESKTOP`, `PHONE`, `TABLET`), `metrics`
- **`get_origin_metrics`**: Evaluate the aggregate performance of an entire website origin.
  - Required params: `origin`
  - Optional params: `formFactor`, `metrics`
- **`get_url_history`**: Get 6-month historical data for a specific page.
  - Required params: `url`
  - Optional params: `formFactor`, `metrics` (Tip: Request only 1-2 metrics to avoid context token limits)
- **`get_origin_history`**: Get 6-month historical data for an entire website origin.
  - Required params: `origin`
  - Optional params: `formFactor`, `metrics`

### Supported Metrics
- `cumulative_layout_shift`
- `first_contentful_paint`
- `interaction_to_next_paint`
- `largest_contentful_paint`
- `experimental_time_to_first_byte`
- `largest_contentful_paint_resource_type`
- `navigation_types`
- `round_trip_time`

## License

ISC
