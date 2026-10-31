import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { getEnvironmentVersions } from './environment.mjs';

const resultSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ok', 'not_installed', 'timeout', 'error', 'unavailable'] },
    version: { type: 'string' },
  },
  required: ['status'], additionalProperties: false,
};
const tool = {
  name: 'get_environment_versions',
  title: 'WSL environment versions',
  description: 'Read the current WSL OS, kernel, Node.js, npm, and Codex CLI versions and UTC collection time. No arguments. Does not start an agent or execute user commands.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  outputSchema: {
    type: 'object',
    properties: {
      os: resultSchema, kernel: resultSchema, node: resultSchema,
      npm: resultSchema, codex: resultSchema,
      collected_at: { type: 'string', format: 'date-time' },
    },
    required: ['os', 'kernel', 'node', 'npm', 'codex', 'collected_at'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};
const server = new Server(
  { name: 'agent-workspace-environment', version: '0.1.0' },
  { capabilities: { tools: {} } },
);
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [tool] }));
server.setRequestHandler(CallToolRequestSchema, async request => {
  if (request.params.name !== tool.name) {
    throw new McpError(ErrorCode.InvalidParams, 'Unknown tool');
  }
  const args = request.params.arguments ?? {};
  if (Object.keys(args).length !== 0) {
    throw new McpError(ErrorCode.InvalidParams, 'This tool accepts no arguments');
  }
  const result = await getEnvironmentVersions();
  return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result };
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await server.close(); process.exit(0); });
}
await server.connect(new StdioServerTransport());
