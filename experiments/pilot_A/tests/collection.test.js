// Run: node experiments/pilot_A/tests/collection.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../collection.js'), 'utf8');

async function scenario(statuses) {
  const elements = {};
  const pending = new Map();
  const requests = [];
  const context = {
    window: {}, AbortSignal, console: { error() {} },
    document: { body: {}, getElementById: id => elements[id] ||= { hidden: true } },
    localStorage: { setItem: (k, v) => pending.set(k, v), removeItem: k => pending.delete(k) },
    fetch: async (_url, options) => {
      requests.push(JSON.parse(options.body));
      const next = statuses.shift();
      if (next instanceof Error) throw next;
      return { status: next, json: async () => next === 400 ? { error: 'INVALID_DATA' } : { message: 'Success' } };
    }
  };
  vm.createContext(context); vm.runInContext(source, context);
  await context.window.PilotCollection.finish({ experimentID: 'abcdefghijkl', filename: 'qa.csv',
    data: 'trial_type\nsurvey-html-form\n', completionUrl: 'https://app.prolific.com/submissions/complete?cc=QA', backupKey: 'pending' });
  return { context, elements, pending, requests };
}
(async () => {
  for (const status of [201, 202]) {
    const s = await scenario([status]);
    assert.equal(s.elements['prolific-completion'].hidden, false);
    assert.equal(s.pending.size, 0);
  }
  for (const failure of [200, 400, 500, new Error('network unavailable')]) {
    const s = await scenario([failure, 201]);
    assert.equal(s.elements['prolific-completion'], undefined);
    assert.equal(s.elements['retry-save'].hidden, false);
    assert.equal(s.elements['download-backup'].hidden, false);
    assert.equal(s.pending.size, 1);
    await s.elements['retry-save'].onclick();
    assert.equal(s.elements['prolific-completion'].hidden, false);
    assert.deepEqual(s.requests[0], s.requests[1]);
    assert.equal(s.pending.size, 0);
  }
  console.log('PASS: 201/202 confirmation, rejection/network failure, retained backup, retry same payload, gated completion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
