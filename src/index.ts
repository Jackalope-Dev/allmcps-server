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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`AllMCPs MCP Server running on stdio (proxying ${MCP_ENDPOINT})`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
