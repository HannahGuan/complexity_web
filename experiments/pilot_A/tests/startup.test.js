// Run: node experiments/pilot_A/tests/startup.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const script = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).join('\n');
async function boot(search, serverCondition = 0, completionUrl = '', status = 200, fixedRecruitment = null) {
  const elements = new Map();
  const element = () => ({ style: {}, classList: { add() {}, remove() {} }, addEventListener() {}, remove() { elements.delete(this.id); } });
  for (const id of ['fullscreen-nag', 'fullscreen-nag-btn']) elements.set(id, element());
  const ctx = { window: { location: { search } }, URLSearchParams, Math, AbortSignal,
    document: { addEventListener() {}, documentElement: {}, body: { style: {}, appendChild(el) { if (el.id) elements.set(el.id, el); } },
      createElement: element, getElementById: id => elements.get(id) || null },
    jsPsychSurveyHtmlForm: 'form', jsPsychHtmlButtonResponse: 'button', jsPsychFullscreen: 'fullscreen',
    console: { error(e) { ctx.error = e; } },
    fetch: async () => { ctx.requests++; return { ok: status === 200, json: async () => ({ condition: serverCondition }) }; },
    initJsPsych(options) { ctx.options = options; return { randomization: { randomID: () => 'qaSubject1', shuffle: a => a },
      data: { addProperties: d => Object.assign(ctx.data, d), get: () => ({ csv: () => 'trial_type\nqa\n' }) },
      run(timeline) { ctx.timeline = timeline; } }; }
  };
  ctx.requests = 0; ctx.data = {};
  vm.createContext(ctx);
  for (const file of ['vignettes.js', 'pilot_config.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
  ctx.window.PILOT_CONFIG.prolific_completion_url = completionUrl;
  ctx.window.PILOT_CONFIG.fixed_recruitment = fixedRecruitment;
  await vm.runInContext(script, ctx);
  return ctx;
}
(async () => {
  const ids = '?PROLIFIC_PID='+'a'.repeat(24)+'&STUDY_ID='+'b'.repeat(24)+'&SESSION_ID='+'c'.repeat(24);
  const url = 'https://app.prolific.com/submissions/complete?cc=QA';
  const cells = new Set();
  for (let i=0;i<32;i++) {
    const live = await boot(ids, i, url);
    assert(live.timeline, String(live.error)); assert.equal(live.requests,1);
    assert.equal(live.data.datapipe_condition,i); assert.equal(live.data.PROLIFIC_PID,'a'.repeat(24));
    assert.equal(live.data.recruitment_target,64); cells.add(live.data.pilot_cell_id);
    const preview=await boot('?test=1&condition='+i);
    assert(preview.timeline);assert.equal(preview.requests,0);
    assert.equal(preview.data.pilot_cell_id,live.data.pilot_cell_id);
    assert.equal(live.timeline.at(-1).data.task,'relevance_check');
    const rating={response:{team_honesty_post:'4',reasoning_post:'QA'}};
    live.options.on_data_update(rating);assert.equal(rating.team_honesty_post,4);assert.equal(rating.reasoning_post,'QA');
  }
  assert.equal(cells.size,32);
  for (const search of ['', ids]) {
    const fixed=await boot(search,31,'',200,'empty_cell_0');
    assert(fixed.timeline,String(fixed.error));assert.equal(fixed.requests,0);
    assert.equal(fixed.data.vignette_category,'Xenobiology in Threa-4');
    assert.equal(fixed.data.relev_typ,'Totality');assert.equal(fixed.data.rev_typ,'Topology');
    assert.equal(fixed.data.complexity,'simple');assert.equal(fixed.data.relevance,'relevant');
    assert.equal(fixed.data.assignment_method,'fixed_supplement');assert.equal(fixed.data.test_mode,false);
    assert.equal(fixed.data.fixed_condition_id,0);assert.equal(fixed.data.datapipe_condition,null);
  }
  for (const n of [-1,32,'0',null]) assert(!(await boot('',n)).timeline);
  const noCode=await boot(ids);assert(noCode.timeline);assert.equal(noCode.requests,1);
  const supplement=await boot(ids+'&supplement=empty_cell_0',31);
  assert(supplement.timeline, String(supplement.error));assert.equal(supplement.requests,0);
  assert.equal(supplement.data.vignette_category,'Xenobiology in Threa-4');
  assert.equal(supplement.data.relev_typ,'Totality');assert.equal(supplement.data.rev_typ,'Topology');
  assert.equal(supplement.data.complexity,'simple');assert.equal(supplement.data.relevance,'relevant');
  assert.equal(supplement.data.assignment_method,'fixed_supplement');assert.equal(supplement.data.datapipe_condition,null);
  assert.equal(supplement.data.fixed_condition_id,0);assert.equal(supplement.data.test_mode,false);
  assert(!(await boot('?supplement=unknown')).timeline);
  assert(!(await boot('?supplement=empty_cell_0&condition=2')).timeline);
  assert(!(await boot(ids,0,'https://invalid.example')).timeline);
  assert(!(await boot('?vignette=0')).timeline);
  assert(!(await boot('',0,'',500)).timeline);
  console.log('PASS: complete bootstrap for all 32 cells, null pre-run content regression, Prolific IDs, flat data, final check ordering and error guards.');
})().catch(e=>{console.error(e);process.exitCode=1;});
