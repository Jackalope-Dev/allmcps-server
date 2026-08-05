<p align="center">
  <img src="assets/logo.png" alt="AllMCPs logo" width="96" height="96">
</p>

<h1 align="center">allmcps-server</h1>

<p align="center">
  <a href="https://allmcps.com/mcp/allmcps-server?verify=04aa8bd4-c85f-4470-b5b4-19d690d1cc11"><img src="https://allmcps.com/api/badge/allmcps-server" alt="AllMCPs Verified"></a>
  <a href="https://www.npmjs.com/package/allmcps-server"><img src="https://img.shields.io/npm/v/allmcps-server.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/allmcps-server"><img src="https://img.shields.io/npm/dm/allmcps-server.svg" alt="npm downloads"></a>
  <a href="https://github.com/Jackalope-Dev/allmcps-server/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/allmcps-server.svg" alt="MIT license"></a>
  <a href="https://glama.ai/mcp/servers/Jackalope-Dev/allmcps-server"><img src="https://glama.ai/mcp/servers/Jackalope-Dev/allmcps-server/badges/score.svg" alt="allmcps-server MCP server"></a>
</p>

The official local MCP server for [AllMCPs.com](https://allmcps.com) — search, browse, get install configs for, and submit Model Context Protocol (MCP) servers directly from Claude, Cursor, or any MCP-compatible agent.

This package is a thin stdio bridge to the [AllMCPs remote MCP endpoint](https://allmcps.com/api/mcp). Tool
behavior lives server-side, so this package always exposes the current live tool set with no need to
upgrade the package when a tool is added or changed.

> **v2.0.0** replaces the single `submit_mcp` tool with the full tool set below, including a renamed
> `submit_mcp_server` (previously `submit_mcp`). If you depend on the old tool name, pin `allmcps-server@1`.

## Install

Requires Node.js 18+. Add to your MCP client config (e.g. `claude_desktop_config.json`):

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

| Tool                    | Required arguments   | Description                                                              |
| ----------------------- | --------------------- | ------------------------------------------------------------------------- |
| `search_mcp_servers`    | —                     | Search the directory by keyword and/or category.                         |
| `get_mcp_install_config`| `id`                  | Get the install config snippet and docs for a server by ID.              |
| `list_mcp_categories`   | —                     | List all categories with server counts.                                  |
| `get_boost_pricing`     | —                     | Get pricing and features for boosting/featuring a listing.               |
| `boost_mcp_server`      | `id`                  | Start a sponsorship/boost order — returns a Stripe checkout URL and x402 invoice. |
| `get_boost_status`      | `id`                  | Check boost and verified-badge status for a listing.                     |
| `submit_mcp_server`     | `name`, `url`, `email`| Submit a new MCP server to the directory.                                |
| `verify_mcp_claim`      | `id`                  | Verify ownership and claim a listing via GitHub README, site badge, or DNS. |

`submit_mcp_server` submissions land in the `pending` review queue at [allmcps.com](https://allmcps.com).
The response includes a `claim_url` and a ready-to-paste `badge_markdown` snippet — adding that badge to
your repo's README verifies the listing instantly instead of waiting on manual review.

Every tool's full input schema (including optional arguments like `category`, `description`, `sku`, and
`method`) is available at runtime via the standard MCP `tools/list` call, or by inspecting
[`/api/mcp`](https://allmcps.com/api/mcp) directly.

## Configuration

| Environment variable | Default                       | Purpose                                  |
| --------------------- | ------------------------------ | ----------------------------------------- |
| `ALLMCPS_MCP_URL`     | `https://allmcps.com/api/mcp` | Override the remote endpoint this package bridges to. |

## Related

- Directory API docs: https://allmcps.com/docs/api
- Remote MCP server (same tools, called directly over HTTP): https://allmcps.com/api/mcp

## License

MIT © [Jackalope Digital](https://jackalope.digital) — see [LICENSE](LICENSE).
