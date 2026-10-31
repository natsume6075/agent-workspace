import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// A separate MCP client process exercises actual initialization/list/call over stdio.
export async function connect() {
  const client = new Client({ name: 'environment-mcp-verifier', version: '0.1.0' });
  const transport = new StdioClientTransport({
    command: process.execPath, args: [fileURLToPath(new URL('./server.mjs', import.meta.url))],
    stderr: 'pipe',
  });
  try { await client.connect(transport); }
  catch (error) { await transport.close(); throw error; }
  return client;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const client = await connect();
  try {
    const { tools } = await client.listTools({}, { timeout: 10000 });
    assert.deepEqual(tools.map(tool => tool.name), ['get_environment_versions']);
    const result = await client.callTool({ name: tools[0].name, arguments: {} }, undefined, { timeout: 15000 });
    assert.ok(!result.isError);
    assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
    console.log(JSON.stringify({ tools: tools.map(tool => tool.name), result: result.structuredContent }, null, 2));
  } finally { await client.close(); }
}
