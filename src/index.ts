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
    version: "1.0.2",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// The human-facing /api/submit requires a Turnstile CAPTCHA token that a headless
// agent has no way to solve. /api/v1/submit is the agent-facing counterpart: same
// insert path, no Turnstile, but it requires an email (for the claim/verify
// notification) since there's no browser session to fall back on.
const DIRECTORY_API_URL = process.env.ALLMCPS_API_URL || "https://allmcps.com/api/v1/submit";

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
              description: "The name of the MCP server.",
            },
            email: {
              type: "string",
              description: "Email address for the submission confirmation and listing claim/verify link. Not published on the listing.",
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
          required: ["url", "name", "email"],
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
    name: string;
    email: string;
    description?: string;
    category?: string;
  };

  if (!args.url) {
    throw new Error("The 'url' argument is required.");
  }
  if (!args.name) {
    throw new Error("The 'name' argument is required.");
  }
  if (!args.email) {
    throw new Error("The 'email' argument is required (used for the submission confirmation and claim link).");
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
        email: args.email,
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

    const lines = [
      `Successfully submitted "${args.name}" to AllMCPs.com!`,
      `Message: ${data.message}`,
      `The server is now in the 'pending' queue for review.`,
    ];

    if (data.claim_url) {
      lines.push(`\nClaim & verify this listing (get verified instantly by adding the badge below): ${data.claim_url}`);
    }

    if (data.badge_markdown) {
      lines.push(`\nBadge markdown for your README:\n${data.badge_markdown}`);
    }

    return {
      content: [
        {
          type: "text",
          text: lines.join("\n"),
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
