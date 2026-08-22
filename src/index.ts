#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "allmcps-server",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// This package is a thin stdio<->HTTP bridge to https://allmcps.com/api/mcp, the
// same JSON-RPC endpoint remote MCP clients call directly. Tool definitions and
// behavior (search, install configs, categories, boosting, submission, claim
// verification) live server-side and are fetched fresh on every request, so this
// package never goes stale relative to the live tool set and needs no republish
// when tools are added or changed remotely.
const MCP_ENDPOINT = process.env.ALLMCPS_MCP_URL || "https://allmcps.com/api/mcp";
const API_BASE = process.env.ALLMCPS_API_URL || "https://allmcps.com";

async function callRemote(method: string, params?: unknown) {
  const response = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const data = (await response.json()) as any;

  if (data.error) {
    throw new Error(data.error.message || "Remote MCP request failed.");
  }

  return data.result;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return await callRemote("tools/list");
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await callRemote("tools/call", {
      name: request.params.name,
      arguments: request.params.arguments,
    });
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error calling AllMCPs: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// --- CLI mode -----------------------------------------------------------
// With no subcommand this package runs as the MCP stdio server above (the
// npx allmcps-server behavior most clients expect). Passed a subcommand, it
// instead becomes a plain scriptable CLI over the same public REST API
// (https://allmcps.com/docs/api) — no MCP client required — so agents and
// developers can call `npx allmcps-server search postgres` directly from a
// shell script or CI step.

const CLI_COMMANDS = ["search", "categories", "server", "help"] as const;
type CliCommand = (typeof CLI_COMMANDS)[number];

function isCliCommand(value: string): value is CliCommand {
  return (CLI_COMMANDS as readonly string[]).includes(value);
}

function printHelp() {
  console.log(`allmcps-server — official AllMCPs CLI & MCP server

Usage:
  allmcps-server                     Run as an MCP stdio server (default)
  allmcps-server search <query>      Search the MCP server directory
  allmcps-server categories          List all directory categories
  allmcps-server server <id>         Get full details for one listing
  allmcps-server help                Show this help

Environment:
  ALLMCPS_API_URL   Override the REST API base (default https://allmcps.com)
  ALLMCPS_MCP_URL   Override the MCP JSON-RPC endpoint (default https://allmcps.com/api/mcp)

Docs: https://allmcps.com/docs/api`);
}

async function fetchJson(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  const body = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      body && typeof body === "object" && "message" in body ? (body as { message?: string }).message : res.statusText;
    throw new Error(`AllMCPs API request failed (${res.status}): ${message}`);
  }
  return body;
}

async function runCli(command: CliCommand, args: string[]) {
  switch (command) {
    case "help": {
      printHelp();
      return;
    }
    case "categories": {
      console.log(JSON.stringify(await fetchJson("/api/v1/categories"), null, 2));
      return;
    }
    case "search": {
      const query = args.join(" ").trim();
      if (!query) {
        console.error("Usage: allmcps-server search <query>");
        process.exit(1);
      }
      console.log(JSON.stringify(await fetchJson(`/api/v1/search?q=${encodeURIComponent(query)}`), null, 2));
      return;
    }
    case "server": {
      const id = args[0];
      if (!id) {
        console.error("Usage: allmcps-server server <id>");
        process.exit(1);
      }
      console.log(JSON.stringify(await fetchJson(`/api/v1/servers/${encodeURIComponent(id)}`), null, 2));
      return;
    }
  }
}

async function main() {
  const [maybeCommand, ...rest] = process.argv.slice(2);

  if (maybeCommand && isCliCommand(maybeCommand)) {
    try {
      await runCli(maybeCommand, rest);
    } catch (error: any) {
      console.error(error?.message || String(error));
      process.exit(1);
    }
    return;
  }

  if (maybeCommand && (maybeCommand === "--help" || maybeCommand === "-h")) {
    printHelp();
    return;
  }

  if (maybeCommand) {
    console.error(`Unknown command "${maybeCommand}". Run "allmcps-server help" for usage.`);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`AllMCPs MCP Server running on stdio (proxying ${MCP_ENDPOINT})`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
