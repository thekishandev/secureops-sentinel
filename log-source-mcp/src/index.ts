#!/usr/bin/env node

/**
 * Log Source MCP Server — SecureOps Sentinel
 *
 * A custom MCP server that simulates a production log source.
 * Exposes two tools:
 *   - get_service_list: returns available services (SAFE / TRUSTED)
 *   - get_recent_logs:  returns recent logs for a service (UNTRUSTED — contains injection)
 *
 * This server is intentionally designed to return untrusted data
 * to demonstrate Archestra's Dual LLM + Dynamic Tools security.
 *
 * Transport: stdio (runs as a pod via Archestra MCP Orchestrator)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { generateLogs, AVAILABLE_SERVICES } from "./log-templates.js";

// ── Server setup ────────────────────────────────────────────────────
const server = new Server(
    {
        name: "log-source-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// ── Tool definitions ────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_service_list",
                description:
                    "Returns a list of all available production services that can be monitored. This is a metadata-only call and does not return any log data.",
                inputSchema: {
                    type: "object" as const,
                    properties: {},
                    required: [],
                },
            },
            {
                name: "get_recent_logs",
                description:
                    "Fetches recent application logs for a given production service. Returns the last 10 log entries with timestamps, severity levels, and contextual details. Use this tool to investigate incidents or check service health.",
                inputSchema: {
                    type: "object" as const,
                    properties: {
                        service: {
                            type: "string",
                            description: `The service name to fetch logs for. Available services: ${AVAILABLE_SERVICES.join(", ")}`,
                            enum: AVAILABLE_SERVICES,
                        },
                        count: {
                            type: "number",
                            description:
                                "Number of log lines to retrieve (default: 10, max: 20)",
                            minimum: 1,
                            maximum: 20,
                        },
                    },
                    required: ["service"],
                },
            },
        ],
    };
});

// ── Tool execution ──────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case "get_service_list": {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(
                            {
                                services: AVAILABLE_SERVICES,
                                count: AVAILABLE_SERVICES.length,
                                description:
                                    "Available production services for log monitoring",
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }

        case "get_recent_logs": {
            const typedArgs = args as { service?: string; count?: number };
            const service = typedArgs?.service;
            const count = Math.min(Math.max(typedArgs?.count ?? 10, 1), 20);

            if (!service) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                error: "Missing required parameter: 'service'",
                                available_services: AVAILABLE_SERVICES,
                            }),
                        },
                    ],
                    isError: true,
                };
            }

            if (!AVAILABLE_SERVICES.includes(service)) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                error: `Unknown service: '${service}'`,
                                available_services: AVAILABLE_SERVICES,
                                hint: "Use get_service_list to see all available services",
                            }),
                        },
                    ],
                    isError: true,
                };
            }

            try {
                const logs = generateLogs(service, count);

                return {
                    content: [
                        {
                            type: "text" as const,
                            text: [
                                `=== Recent Logs: ${service} ===`,
                                `Retrieved: ${new Date().toISOString()}`,
                                `Lines: ${logs.length}`,
                                `${"─".repeat(60)}`,
                                ...logs,
                                `${"─".repeat(60)}`,
                                `End of logs for ${service}`,
                            ].join("\n"),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({
                                error: `Failed to retrieve logs: ${error instanceof Error ? error.message : String(error)}`,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
        }

        default:
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify({
                            error: `Unknown tool: '${name}'`,
                            available_tools: ["get_service_list", "get_recent_logs"],
                        }),
                    },
                ],
                isError: true,
            };
    }
});

// ── Start server ────────────────────────────────────────────────────
async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Log Source MCP server running on stdio");
    console.error(`Available services: ${AVAILABLE_SERVICES.join(", ")}`);
}

main().catch((error) => {
    console.error("Fatal error starting Log Source MCP server:", error);
    process.exit(1);
});
