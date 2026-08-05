# allmcps-server

The official local MCP server for [AllMCPs.com](https://allmcps.com) — submit a Model Context Protocol (MCP) server to the directory directly from Claude, Cursor, or any MCP-compatible agent.

## Install

Add to your MCP client config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "allmcps": {
      "command": "npx",
      "args": ["-y", "allmcps-server"]
    }
  }
}
```

## Tools

### `submit_mcp`

Submit a new MCP server to the AllMCPs directory.

| Argument      | Required | Description                                                        |
| ------------- | -------- | ------------------------------------------------------------------ |
| `url`         | yes      | GitHub repository URL or website of the MCP server                |
| `name`        | no       | Server name (inferred from the repo if omitted)                    |
| `description` | no       | Short summary (pulled from the repo description if omitted)        |
| `category`    | no       | e.g. `Database`, `File System`, `Web Search`, `Development`        |

Submissions land in the `pending` review queue at [allmcps.com](https://allmcps.com).

## Related

- Directory API docs: https://allmcps.com/docs/api
- Remote MCP server (search, install configs, categories): https://allmcps.com/api/mcp
