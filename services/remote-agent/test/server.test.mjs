import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createRemoteServer } from '../server.mjs';
import { fixture, waitFor } from './helpers.mjs';

async function connect(t, script, humanForm = false) {
  const { manager, clients } = fixture(t, script);
  const server = createRemoteServer(manager, { getCapabilities: async () => ({ test: true }) });
  const client = new Client({ name: 'test', version: '1' }, { capabilities: humanForm ? { elicitation: { form: {} } } : {} });
  const [a, b] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await server.close(); });
  await server.connect(a); await client.connect(b);
  return { client, manager, clients };
}
const submit = { name: 'submit_agent_task', arguments: { request_id: 'mcp-test', instruction: 'Write and test something', backend: 'codex', workspace: 'workspace' } };

test('MCP validates all inputs, preserves the environment tool, and returns actual job results', async t => {
  const { client, manager } = await connect(t, c => c.complete('Verified result'));
  const tools = (await client.listTools()).tools;
  assert.equal(tools.length, 8);
  assert.ok(tools.some(t => t.name === 'get_environment_versions'));
  for (const tool of tools) assert.equal(tool.inputSchema.additionalProperties, false);
  const result = await client.callTool(submit);
  assert.ok(!result.isError);
  assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
  const id = result.structuredContent.job_id;
  await waitFor(() => manager.view(id).status === 'completed');
  const done = await client.callTool({ name: 'get_agent_task', arguments: { job_id: id } });
  assert.equal(done.structuredContent.result, 'Verified result');
  const newOnly = await client.callTool({ name: 'get_agent_task', arguments: { job_id: id, cursor: done.structuredContent.next_cursor } });
  assert.deepEqual(newOnly.structuredContent.events, []);
  await assert.rejects(client.callTool({ ...submit, arguments: { ...submit.arguments, command: 'id' } }));
  await assert.rejects(client.callTool({ ...submit, arguments: { ...submit.arguments, workspace: '/etc' } }));
  await assert.rejects(client.callTool({ name: 'resolve_agent_approval', arguments: { job_id: id, approval_id: id, approve: true } }));
});

test('unsupported MCP client cannot approve; capable client must elicit the human decision', async t => {
  const noForm = await connect(t, c => c.approval());
  const id = (await noForm.client.callTool(submit)).structuredContent.job_id;
  await waitFor(() => noForm.manager.view(id).status === 'awaiting_approval');
  const approval = noForm.manager.view(id).pending_approvals[0].approval_id;
  const result = await noForm.client.callTool({ name: 'resolve_agent_approval', arguments: { job_id: id, approval_id: approval } });
  assert.equal(result.structuredContent.approval_resolution, 'unsupported_client');
  assert.equal(noForm.clients[0].responses.length, 0);
  const yesForm = await connect(t, c => c.approval(), true);
  let shown = false;
  yesForm.client.setRequestHandler(ElicitRequestSchema, async req => {
    assert.equal(req.params.mode, 'form');
    assert.match(req.params.message, /example-command/);
    shown = true;
    return { action: 'accept', content: { approve: true } };
  });
  const other = (await yesForm.client.callTool(submit)).structuredContent.job_id;
  await waitFor(() => yesForm.manager.view(other).status === 'awaiting_approval');
  const a = yesForm.manager.view(other).pending_approvals[0].approval_id;
  const resolved = await yesForm.client.callTool({ name: 'resolve_agent_approval', arguments: { job_id: other, approval_id: a } });
  assert.ok(!resolved.isError); assert.ok(shown);
  assert.deepEqual(yesForm.clients[0].responses, [{ id: 17, result: { decision: 'accept' } }]);
});
