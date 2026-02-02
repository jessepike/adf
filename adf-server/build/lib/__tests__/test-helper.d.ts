import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function getServer(): McpServer;
export declare function callTool(name: string, args?: Record<string, unknown>): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
