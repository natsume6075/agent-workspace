import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connect } from '../verify.mjs';
import { runVersion } from '../environment.mjs';

test('MCP advertises exactly one tool; returns versions; rejects commands and unknown tools', async () => {
  const client = await connect();
  try {
    const { tools } = await client.listTools({}, { timeout: 10000 });
    assert.deepEqual(tools.map(tool => tool.name), ['get_environment_versions']);
    assert.equal(tools[0].inputSchema.additionalProperties, false);
    const result = await client.callTool({ name: 'get_environment_versions', arguments: {} }, undefined, { timeout: 15000 });
    assert.ok(!result.isError);
    const data = result.structuredContent;
    assert.deepEqual(JSON.parse(result.content[0].text), data);
    assert.deepEqual(Object.keys(data).sort(), ['os', 'kernel', 'node', 'npm', 'codex', 'collected_at'].sort());
    assert.equal(data.os.status, 'ok');
    assert.equal(data.node.version, process.version);
    assert.ok(Number.isFinite(Date.parse(data.collected_at)));
    await assert.rejects(client.callTool({ name: 'get_environment_versions', arguments: { command: 'id' } }));
    await assert.rejects(client.callTool({ name: 'execute_command', arguments: {} }));
  } finally { await client.close(); }
});

test('missing command is reported without raw error or environment', async () => {
  assert.deepEqual(await runVersion('/nonexistent/environment-mcp-command', []), { status: 'not_installed' });
});

test('a stalled subprocess is killed by the deadline', async () => {
  const start = Date.now();
  assert.deepEqual(await runVersion(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeout: 100 }), { status: 'timeout' });
  assert.ok(Date.now() - start < 3000);
});
