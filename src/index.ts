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
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const DIRECTORY_API_URL = process.env.ALLMCPS_API_URL || "https://allmcps.com/api/submit";

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "submit_mcp",
        description: "Submit a new Model Context Protocol (MCP) server to the AllMCPs directory.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The GitHub repository URL or website of the MCP server.",
            },
            name: {
              type: "string",
              description: "Optional. The name of the MCP server. If omitted, the directory will try to infer it from the GitHub repo.",
            },
            description: {
              type: "string",
              description: "Optional. A brief description of what the server does. If omitted, it will try to pull from the GitHub repo description.",
            },
            category: {
              type: "string",
              description: "Optional. The category of the server (e.g., 'Database', 'File System', 'Web Search', 'Development', 'Productivity').",
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "submit_mcp") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments as {
    url: string;
    name?: string;
    description?: string;
    category?: string;
  };

  if (!args.url) {
    throw new Error("The 'url' argument is required.");
  }

  try {
    const response = await fetch(DIRECTORY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: args.url,
        name: args.name,
        description: args.description,
        category: args.category,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to submit MCP server. Error: ${JSON.stringify(data.error || data)}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Successfully submitted the MCP server to AllMCPs.com!\nMessage: ${data.message}\n\nThe server is now in the 'pending' queue for review.`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Network error while submitting to the directory: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AllMCPs Meta Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
