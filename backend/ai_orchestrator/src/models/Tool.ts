/**
 * MCP Tool Types
 * Definición de tipos para tools MCP
 */

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: any;
    }>;
    required: string[];
  };
}

export interface ToolCall {
  toolName: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolName: string;
  success: boolean;
  data?: any;
  formatted?: string;
  error?: string;
}
