# allmcps-server

[![AllMCPs Verified](https://allmcps.com/api/badge/allmcps-server)](https://allmcps.com/mcp/allmcps-server?verify=04aa8bd4-c85f-4470-b5b4-19d690d1cc11)

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
| `name`        | yes      | Server name                                                        |
| `email`       | yes      | Where the claim/verify link and submission confirmation are sent — not published on the listing |
| `description` | no       | Short summary (pulled from the repo description if omitted)        |
| `category`    | no       | e.g. `Database`, `File System`, `Web Search`, `Development`        |

Submissions land in the `pending` review queue at [allmcps.com](https://allmcps.com). The response
includes a `claim_url` and a ready-to-paste `badge_markdown` snippet — adding that badge to your
repo's README verifies the listing instantly instead of waiting on manual review.

## Related

- Directory API docs: https://allmcps.com/docs/api
- Remote MCP server (search, install configs, categories): https://allmcps.com/api/mcp
