import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppServer } from '../app-server.mjs';

test('stdio JSON-RPC correlates replies, forwards server requests, and reports errors and process exit', async () => {
  const fake = `
    const rl = require('node:readline').createInterface({input:process.stdin});
    rl.on('line', line => {
      const m=JSON.parse(line);
      if (m.method==='initialize') console.log(JSON.stringify({id:m.id,result:{ready:true}}));
      if (m.method==='echo') console.log(JSON.stringify({id:m.id,result:m.params}));
      if (m.method==='bad') console.log(JSON.stringify({id:m.id,error:{message:'test failure'}}));
      if (m.method==='approval') {
        console.log(JSON.stringify({id:'human-1',method:'item/commandExecution/requestApproval',params:{command:'example'}}));
        console.log(JSON.stringify({id:m.id,result:{}}));
      }
    });`;
  const app = new AppServer({ command: process.execPath, args: ['-e', fake], requestTimeout: 1000 });
  try {
    await app.initialize();
    const tricky = { prompt: '`touch /never` $(echo no); "\n --flag' };
    assert.deepEqual(await app.request('echo', tricky), tricky);
    await assert.rejects(app.request('bad'), /test failure/);
    const requested = new Promise(resolve => app.once('request', resolve));
    await app.request('approval');
    assert.equal((await requested).id, 'human-1');
  } finally { await app.stop(); }
  assert.equal(app.closed, true);
  await assert.rejects(app.request('echo', {}), /not running/);
});
