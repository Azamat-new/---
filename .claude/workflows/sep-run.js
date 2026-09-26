export const meta = {
  name: 'sep-run',
  description: 'Separator: run one epic through the funnel (intake → zones → plan → spikes → execute → gate → inspect → blind → verdict → merge → learn); pauses at human gates and resumes from artifacts',
  whenToUse: 'Use for any non-trivial change request on this repository. Pass {request:"..."} for a new epic or {epic:"<id>"} to resume one.',
  phases: [
    { title: 'Intake', detail: 'S0 triage + independent intent check, S1 zones' },
    { title: 'Plan', detail: 'S2 decomposition + audit, S3 schedule, S4 spikes (failing acceptance tests)' },
    { title: 'Build', detail: 'per unit: S5 execute → gate → S6 inspect → S7 blind → S8 verdict → merge' },
    { title: 'Learn', detail: 'S9 integration check, metrics, lessons' },
  ],
}

// -------------------------------------------------------------------------------------------------
// The script is deliberately thin: every decision, counter and transition lives in the CLI
// (`node .separator/bin/sep.cjs next <epic>` is the state machine). The script only asks "what next?"
// and dispatches the right role. Any driver (a bash loop, a human, another tool) can follow the same
// loop, which is what makes the funnel resumable and tool-agnostic.
// -------------------------------------------------------------------------------------------------
const SEP = 'node .separator/bin/sep.cjs'
const MAX_ITER = args.max_iterations || 60
const AUTH = 'The workflow authorizes every git and file operation named in this task inside your isolated worktree; do not ask for confirmation.'

const RUN = { type: 'object', properties: { json: { type: 'string', description: 'the exact JSON text the command printed on stdout, copied verbatim (or {"ok":false,"error":"..."} if it printed none)' } }, required: ['json'] }
// runners return the printed JSON as text; parse it (tolerating fences and prefixes)
function unwrap(r) {
  if (!r || typeof r !== 'object') return r
  const txt = typeof r.json === 'string' ? r.json : (typeof r.raw === 'string' ? r.raw : null)
  if (txt !== null) {
    const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(txt)
    const cand = [fence ? fence[1] : null, txt, txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)].filter(Boolean)
    for (const c of cand) { try { const v = JSON.parse(c); if (v && typeof v === 'object') return v } catch (e) { } }
    return { ok: false, error: 'unparseable runner output: ' + txt.slice(0, 300) }
  }
  return r
}

// mechanical step: a cheap runner agent executes one command and returns the JSON it printed
let cheapModel = 'haiku'
async function cheap(prompt, opts) {
  // mechanical steps use the cheapest model available; fall back to the session model if the alias is rejected
  try { return await agent(prompt, Object.assign({ effort: 'low' }, cheapModel ? { model: cheapModel } : {}, opts)) }
  catch (e) { if (cheapModel && /model/i.test(String(e && e.message || e))) { log(`model '${cheapModel}' not available for runners; using the session model`); cheapModel = null; return await agent(prompt, Object.assign({ effort: 'low' }, opts)) } throw e }
}
async function run(cmd, label, opts) {
  const r = await cheap(`You are a command runner (no judgment, no fixes). From the repository root run exactly this command with Bash:\n\n${cmd}\n\nReturn, in the field "json", the EXACT JSON text the command printed on stdout, copied verbatim and complete (ignore the exit code; sep prints JSON even on failure). If it printed no JSON, put {"ok": false, "error": "<last 400 characters of the output>"} there.`,
    Object.assign({ label: label || cmd.slice(0, 60), schema: RUN }, opts || {}))
  if (!r) return { ok: false, error: 'runner returned nothing' }
  return unwrap(r)
}

// role step: use the registered custom agent when the session knows it (enforced mode: restricted tools,
// omitClaudeMd, worktree isolation); otherwise fall back to the default agent reading its role card.
const fallbackNoted = {}
async function role(name, prompt, opts) {
  try { return await agent(prompt, Object.assign({}, opts, { agentType: name })) }
  catch (e) {
    if (!/not found/i.test(String(e && e.message || e))) throw e
    if (!fallbackNoted[name]) { fallbackNoted[name] = true; log(`agent ${name} is not registered in this session (restart Claude Code to enable enforced mode); using its role card as a prompt`) }
    return await agent(`Your role card is the file .claude/agents/${name}.md. Read it first with the Read tool and obey it as your system prompt for this whole task (tool restrictions included: if it says you may not write, do not write).\n\n${prompt}`, opts)
  }
}

async function record(e, u, name, json, thenCmd) {
  const p = `.separator/epics/${e}/units/${u}/${name}`
  const r = await cheap(`You are a recorder (no judgment). 1) With the Write tool, write this JSON to ${p} exactly as given (pretty-printed is fine):\n${JSON.stringify(json)}\n2) Then run with Bash from the repository root: ${thenCmd}\n3) Return, in the field "json", the exact JSON text that command printed (verbatim); if it printed no JSON put {"ok": false, "error": "<last 400 chars>"} there.`, { label: `record:${name}`, schema: RUN })
  return unwrap(r) || { ok: false, error: 'recorder returned nothing' }
}

// -------------------------------------------------------------------------------------------------
// step handlers
// -------------------------------------------------------------------------------------------------
const TRIAGE_OUT = { type: 'object', properties: { class: { type: 'string', enum: ['T0', 'T1', 'T2', 'T3'] }, acceptance: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, text: { type: 'string' } }, required: ['id', 'text'] } }, questions: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, text: { type: 'string' }, default: { type: 'string' }, why: { type: 'string' } }, required: ['id', 'text', 'default', 'why'] } }, est_paths: { type: 'array', items: { type: 'string' } }, files_written: { type: 'array', items: { type: 'string' } } }, required: ['class', 'acceptance', 'questions', 'est_paths', 'files_written'] }
const INTENT_OUT = { type: 'object', properties: { acceptance: { type: 'array', items: { type: 'string' } } }, required: ['acceptance'] }
const COMPARE_OUT = { type: 'object', properties: { mismatch: { type: 'boolean' }, missing: { type: 'array', items: { type: 'string' } }, extra: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } }, required: ['mismatch', 'missing', 'extra', 'note'] }

async function stepTriage(e, n) {
  phase('Intake')
  const dir = `.separator/epics/${e}`
  const [tri, intent] = await parallel([
    () => role('sep-triage', `Epic ${e}. The verbatim request is in ${dir}/request.md (also quoted below). Read .separator/zones.json, .separator/rulings.md and .separator/lessons.md, and look at the repository only as far as needed to estimate the affected paths.
Write, with the Write tool:
1. ${dir}/ACCEPTANCE.md — WHAT the user will observe, one line per criterion in the form "- A1 (observable_by_user): WHEN … THE SYSTEM SHALL …". No implementation verbs (refactor, extract, use, add table, migrate, rename, cache). Every criterion must be checkable by running something.
2. ${dir}/triage.json — {"class": "T0|T1|T2|T3", "signals": [...], "zones": [...], "est_paths": [...], "est_files": n, "est_lines": n, "unknowns": [...], "ambiguity": 0..1, "questions": [{"id","text","default","why"}], "assumptions": [{"text","kind":"cosmetic|intent"}], "irreversible": false, "premortem": "…(T2+ only)", "batch": []}
Classification signals: T0 = one zone, ≤3 files, ≤80 lines, no behaviour change beyond the obvious; T1 = ≤2 zones, ≤8 files, no public contract change; T2 = public API/schema/migration/auth/billing/infra or >8 files; T3 = irreversible effects, data deletion, new zone, architecture. When unsure, classify UP. Ask at most 5 questions, each with a safe default and one line of why; if a safe default exists, do not block on the question.
Request:\n"""\n${n.request}\n"""`, { label: 'S0 triage', schema: TRIAGE_OUT }),
    () => role('sep-intent-checker', `You see ONLY the user's verbatim request below. Do not read any file. List what would have to be observably true for the user to say "done" (3-8 short criteria, each testable).\nRequest:\n"""\n${n.request}\n"""`, { label: 'S0 intent check', schema: INTENT_OUT, effort: 'low' }),
  ])
  if (!tri) return { fatal: 'triage failed' }
  const cmp = await agent(`Compare two independent readings of the same request. TRIAGE acceptance: ${JSON.stringify(tri.acceptance)}. INDEPENDENT reading: ${JSON.stringify(intent ? intent.acceptance : [])}. Report criteria present in the independent reading but missing from the triage (semantic match is enough; wording may differ), and vice versa. mismatch=true only if a user-visible outcome is missing from the triage. Then write the result as JSON to ${dir}/intent-check.json with the Write tool ({"acs_from_request": [...], "matched": [...], "missing": [...], "extra": [...], "mismatch": bool, "note": "..."}).`, { label: 'S0 intent compare', schema: COMPARE_OUT, effort: 'low' })
  log(`triage: class ${tri.class}, ${tri.acceptance.length} criteria, ${tri.questions.length} questions, intent mismatch=${cmp ? cmp.mismatch : 'n/a'}`)
  return run(`${SEP} epic classify ${e}`, 'S0 classify')
}

async function stepCartography(e, n) {
  phase('Intake')
  await role('sep-cartographer', `Epic ${e}. These paths are not covered by a declared zone in .separator/zones.json: ${JSON.stringify(n.unmapped)}. Infer zones for them from build files (package.json, pyproject, go.mod, Cargo.toml, Makefile, CI config), directory structure and git churn (git log --stat is allowed). For each new zone append an entry to .separator/zones.json (id, paths, lang, commands {setup,build,test,fast,lint,run,mutate} — use null when unknown, never invent —, test_globs, serialized_resources, invariants, persona, risk_floor, confidence: "inferred", suite_seconds: null). Keep existing zones untouched. Also write .separator/epics/${e}/zones.patch.json listing what you added so the human can declare it later. Do not read the request; zones are request-independent.`, { label: 'S1 cartography' })
  return run(`${SEP} epic classify ${e}`, 'S1 reclassify')
}

const PLAN_OUT = { type: 'object', properties: { units: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, zone: { type: 'string' }, writes: { type: 'array', items: { type: 'string' } }, acceptance: { type: 'array', items: { type: 'string' } } }, required: ['id', 'title', 'zone', 'writes', 'acceptance'] } }, notes: { type: 'string' } }, required: ['units', 'notes'] }
async function stepPlan(e, n, replanUnits) {
  phase('Plan')
  const dir = `.separator/epics/${e}`
  const retry = n.retry ? `\nThe previous plan failed validation with: ${JSON.stringify(n.retry)}. Fix exactly these problems.` : ''
  const replan = replanUnits ? `\nREPLAN: units ${JSON.stringify(replanUnits)} were sent back by a reviewer or a spike. Read their ${dir}/units/<u>/defects/*.json, spike.json and notes.md, and rewrite ONLY those units (split, re-scope or re-contract them); keep every other unit's id and content unchanged; merged units are immutable.` : ''
  const p = await role('sep-planner', `Epic ${e} (class ${n.class || 'T1'}). Read ${dir}/request.md, ${dir}/ACCEPTANCE.md, ${dir}/triage.json, ${dir}/answers.md if present, .separator/zones.json, .separator/rulings.md, .separator/lessons.md. Explore the code (read-only) to confirm every assumption; never assume something is missing without a search.
Write ${dir}/dag.json: {"epic":"${e}","units":[{"id":"U1","title":"…","goal":"one sentence","zone":"<zone id>","writes":["glob",…],"test_writes":["path of the acceptance test the prober will create"],"reads":[…],"depends_on":[…],"class":"T0|T1|T2|T3","unknowns":[…],"est_files":n,"est_lines":n,"acceptance":["A1",…],"serialized":[…],"checks":[{"id":"C1","maps_to":"A1","kind":"check","cmd":"<command that must exit 0 when A1 holds>","expect":"exit 0","timeout":120}],"must_not_touch":[…],"interface":"…(only for cross-zone units)"}]}
Rules: one zone per unit; write-sets of units in the same wave must not overlap; each unit fits one fresh context (≤8 files, ≤300 lines); hardest/most uncertain unit first; contract-shaped units (schemas, migrations, generated clients, lockfiles) first and alone; every acceptance criterion maps to at least one unit; every unit has at least one runnable check; a check is a real command in this repository's conventions (the zone's test runner), not prose. For T0 produce exactly one unit. Do not write code or tests.${retry}${replan}`, { label: replanUnits ? 'S2 replan' : 'S2 plan', schema: PLAN_OUT, effort: 'high' })
  if (!p) return { fatal: 'planner failed' }
  return run(`${SEP} plan check ${e}`, 'S2 plan check')
}

const AUDIT_OUT = { type: 'object', properties: { implied_acceptance: { type: 'array', items: { type: 'string' } }, gaps: { type: 'array', items: { type: 'string' } }, overlaps: { type: 'array', items: { type: 'string' } } }, required: ['implied_acceptance', 'gaps', 'overlaps'] }
async function stepAudit(e) {
  phase('Plan')
  const dir = `.separator/epics/${e}`
  const a = await role('sep-plan-auditor', `Read ONLY ${dir}/dag.json (do not read request.md, ACCEPTANCE.md or anything else). Back-translate the plan: list the user-visible acceptance criteria this plan would satisfy if every unit succeeded (implied_acceptance), any behaviour two units both seem to implement (overlaps), and any unit whose checks do not prove its title (gaps).`, { label: 'S2 audit', schema: AUDIT_OUT })
  const cmp = await agent(`Read ${dir}/ACCEPTANCE.md. The plan, read blind, implies these criteria: ${JSON.stringify(a ? a.implied_acceptance : [])}; overlaps: ${JSON.stringify(a ? a.overlaps : [])}; gaps: ${JSON.stringify(a ? a.gaps : [])}. Which criteria in ACCEPTANCE.md are NOT implied by the plan (missing)? mismatch=true if any user-visible criterion is missing. Write the coverage result to ${dir}/coverage.json with the Write tool.`, { label: 'S2 coverage', schema: COMPARE_OUT, effort: 'low' })
  if (cmp && cmp.mismatch) {
    log(`plan audit found gaps: ${cmp.missing.join('; ')}`)
    await role('sep-planner', `Epic ${e}. An independent audit of ${dir}/dag.json found acceptance criteria the plan does not cover: ${JSON.stringify(cmp.missing)} (overlaps: ${JSON.stringify(a ? a.overlaps : [])}). Revise ${dir}/dag.json so every criterion in ${dir}/ACCEPTANCE.md is covered by a unit with a runnable check. Keep unit ids stable where possible.`, { label: 'S2 plan fix', schema: PLAN_OUT, effort: 'high' })
    const chk = await run(`${SEP} plan check ${e}`, 'S2 plan re-check')
    if (chk && chk.ok === false) return chk
  }
  return run(`${SEP} mark ${e} audited=true`, 'S2 mark audited')
}

const SPIKE_OUT = { type: 'object', properties: { verdict: { type: 'string', enum: ['feasible', 'infeasible', 'replan'] }, hypotheses: { type: 'array', items: { type: 'object', properties: { claim: { type: 'string' }, result: { type: 'string', enum: ['supported', 'refuted', 'unverifiable'] }, how: { type: 'string' } }, required: ['claim', 'result', 'how'] } }, red_proof: { type: 'object', properties: { cmd: { type: 'string' }, exit: { type: 'integer' } }, required: ['cmd', 'exit'] }, tests_written: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } } }, required: ['verdict', 'hypotheses', 'red_proof', 'tests_written', 'risks'] }
async function stepSpike(e, units) {
  phase('Plan')
  const results = await parallel(units.map(u => () => role('sep-prober', `Spike for unit ${u} of epic ${e}. ${AUTH}
1. Run: ${SEP} unit start ${e} ${u} --role prober — it checks out the unit branch and prints your packet (card, zone commands, acceptance). Then run: ${SEP} unit packet ${e} ${u} --for prober for the full card.
2. List at most 5 claims the plan rests on ("X exists", "the API behaves like Y", "the test runner picks up files matching Z"), ranked by importance × missing evidence, and falsify each as cheaply as possible: grep/read, --help, a 3-line script, a throwaway probe. Resolve every new import/package/flag against what is actually installed. Record each as supported / refuted / unverifiable.
3. Write the ACCEPTANCE TEST(S) at exactly the path(s) in the card's test_writes, in the zone's test convention, covering the card's acceptance ids (A1…). Run them through: ${SEP} unit run ${e} ${u} -- <the card's check command>  — they MUST FAIL now (red proof) for the right reason (missing feature, not a syntax error). Do not implement the feature; probe code is thrown away, only the tests survive.
4. Finish: ${SEP} unit finish ${e} ${u} --status pass  (commits the tests with a neutral message). Then write ${'`'}spike.json${'`'} content via: ${SEP} unit note ${e} ${u} "<one-line summary>" and return the structured result. If a claim is refuted so that the plan cannot work, return verdict "replan" or "infeasible" with the evidence.`, { label: `S4 spike ${u}`, schema: SPIKE_OUT, isolation: 'worktree' })))
  const outcomes = []
  for (let i = 0; i < units.length; i++) {
    const u = units[i], r = results[i]
    if (!r) { outcomes.push({ unit: u, error: 'prober failed' }); continue }
    await record(e, u, 'spike.json', r, r.verdict === 'feasible' ? `${SEP} mark ${e} ${u} stage=spiked spike_verdict=feasible` : `${SEP} mark ${e} ${u} stage=replan spike_verdict=${r.verdict}`)
    outcomes.push({ unit: u, verdict: r.verdict, red: r.red_proof })
  }
  log(`spikes: ${outcomes.map(o => `${o.unit}=${o.verdict || o.error}`).join(', ')}`)
  return outcomes
}

const EXEC_OUT = { type: 'object', properties: { status: { type: 'string', enum: ['pass', 'fail', 'blocked'] }, head_sha: { type: 'string' }, summary: { type: 'string' }, files_touched: { type: 'array', items: { type: 'string' } }, blocked_reason: { type: 'string' } }, required: ['status', 'head_sha', 'summary', 'files_touched', 'blocked_reason'] }
const INSPECT_OUT = { type: 'object', properties: { verdict: { type: 'string', enum: ['pass', 'fix', 'replan', 'kill'] }, findings: { type: 'array', items: { type: 'object', properties: { claim: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'important', 'minor'] }, origin: { type: 'string', enum: ['code', 'contract', 'decomposition', 'request'] }, file: { type: 'string' }, line: { type: 'integer' }, repro: { type: 'object', properties: { cmd: { type: 'string' }, expect: { type: 'string' }, got: { type: 'string' } }, required: ['cmd', 'expect', 'got'] }, hazard: { type: 'string' } }, required: ['claim', 'severity', 'origin'] } }, rerun_gate_pass: { type: 'boolean' }, note: { type: 'string' } }, required: ['verdict', 'findings', 'rerun_gate_pass', 'note'] }

async function unitCycle(e, unit, lane) {
  phase('Build')
  const u = unit.id
  let stage = unit.stage
  const cls = unit.class || 'T1'
  const inspectLenses = (lane && lane.inspect_lenses) || []
  const blindLenses = (lane && lane.blind_lenses) || ['cold']
  for (let step = 0; step < 14; step++) {
    if (['planned', 'spiked', 'execute'].includes(stage)) {
      const r = await role('sep-executor', `Execute unit ${u} of epic ${e} (class ${cls}, round ${unit.round || 0}). ${AUTH}
1. Run: ${SEP} unit start ${e} ${u} --role executor — it checks out branch sep/${e}/${u} in this worktree and prints your write-set and commands. Then: ${SEP} unit packet ${e} ${u} — your ENTIRE world: card (goal, acceptance ids, write-set, must-not-touch, checks), zone commands, spike results, defects to fix (each has a repro: make it pass), notes from previous attempts, rulings.
2. Implement exactly the card inside the write-set. Small, readable changes; follow the zone's conventions. Tests verify, they do not define: never edit acc_*/regress_* tests or existing tests; if coverage is missing, ADD a new test file. If the card, a test or a ruling is wrong or the write-set is too narrow, do not work around it: ${SEP} unit note ${e} ${u} "SCOPE-REQUEST: …" and finish with --status blocked.
3. Prove it: run every check command from the card and the zone's fast/test commands THROUGH ${SEP} unit run ${e} ${u} -- <cmd> (this records evidence; assertions are not evidence). All must exit 0.
4. Finish: ${SEP} unit finish ${e} ${u} --status pass  (neutral commit; never write intent or ticket ids into commit messages or code comments; never push).
Return status, head_sha, a one-line summary, files_touched, blocked_reason.`, { label: `S5 execute ${u} r${unit.round || 0}`, schema: EXEC_OUT, isolation: 'worktree', effort: lane && lane.effort })
      if (!r) return { unit: u, stopped: 'executor failed' }
      if (r.status === 'blocked') { await run(`${SEP} mark ${e} ${u} stage=replan`, `mark ${u} replan`); return { unit: u, stopped: 'blocked', reason: r.blocked_reason } }
      stage = 'executed'
    }
    if (stage === 'executed') {
      const g = await run(`${SEP} gate ${e} ${u}`, `gate ${u}`)
      stage = g && g.pass ? 'gated' : 'gate_failed'
      log(`${u}: gate ${stage === 'gated' ? 'PASS' : 'FAIL ' + JSON.stringify(g && (g.failed || g.error))}`)
    }
    if (stage === 'gate_failed') {
      const d = await run(`${SEP} decide ${e} ${u}`, `decide ${u}`)
      stage = d && d.action === 'SENDBACK' && d.target === 'S5' ? 'execute' : (d && d.action === 'ESCALATE' ? 'card' : 'replan')
      unit.round = (unit.round || 0) + 1
      if (stage === 'replan') { return { unit: u, stopped: 'sendback', target: d && d.target, why: d && d.why } }
      continue
    }
    if (stage === 'gated' || stage === 'inspect') {
      if (inspectLenses.length) {
        const ins = await parallel(inspectLenses.map(lens => () => role('sep-inspector', `Inspect unit ${u} of epic ${e} through the ${lens.toUpperCase()} lens. ${AUTH}
Run: git checkout -q sep/${e}/${u} (in this worktree) then: ${SEP} unit packet ${e} ${u} --for inspector — the card, contract checks, spike, gate result, evidence and diff stat. You have the plan's context but NOT the author's reasoning; you did not write this code.
Re-run the gate commands yourself (the zone test command and each contract check); do not trust evidence.json. Then look for "green but wrong": contract met in letter not spirit, regressions, weakened or tautological tests, missed edge cases the plan named, hazards (${lens === 'correctness' ? 'correctness, contract conformance, error paths' : 'blast radius, data, security, concurrency, migrations'}).
Every blocking finding needs a repro you actually ran ({cmd, expect, got}) OR a hazard class from policy.hazard_classes; anything else is a minor note (max 5). Tag each finding's origin: code / contract (the check is wrong) / decomposition (the unit is wrong) / request (the request is ambiguous). verdict: pass | fix (counted findings exist) | replan (unit wrongly cut) | kill (should not be built). An empty findings list is a valid, common result. A ruling in the packet overrides your judgment: report a conflict, do not re-litigate.`, { label: `S6 inspect ${u} ${lens}`, schema: INSPECT_OUT, isolation: 'worktree', effort: 'high' })))
        for (let i = 0; i < inspectLenses.length; i++) if (ins[i]) await record(e, u, `inspect-${inspectLenses[i]}.json`, Object.assign({ lens: inspectLenses[i], unit: u }, ins[i]), `${SEP} ratchet ${e} ${u} .separator/epics/${e}/units/${u}/inspect-${inspectLenses[i]}.json`)
        const kill = ins.filter(Boolean).find(i => i.verdict === 'kill' || i.verdict === 'replan')
        log(`${u}: inspect ${ins.filter(Boolean).map((i, k) => `${inspectLenses[k]}=${i.verdict}(${i.findings.length})`).join(' ')}`)
        if (kill) { const d = await run(`${SEP} decide ${e} ${u}`, `decide ${u}`); return { unit: u, stopped: d && d.action, why: d && d.why } }
      }
      stage = 'inspected'
    }
    if (stage === 'inspected' || stage === 'blind' || stage === 'blinded') {
      for (const lens of blindLenses) {
        const b = await run(`${SEP} blind ${e} ${u} --lens ${lens} --rebuild`, `S7 blind ${u} ${lens}`, { effort: 'low' })
        log(`${u}: blind ${lens} → ${b && (b.verdict || b.error)}`)
      }
      const cmpM = await agent(`Read .separator/epics/${e}/ACCEPTANCE.md and .separator/epics/${e}/units/${u}/blind/blind-cold.json if it exists (field inferred_intent: what a stranger thinks this change does). If the stranger's description matches the acceptance criteria this unit covers (${JSON.stringify(unit.acceptance || [])}) at the level of user-visible behaviour, answer MATCH; if it describes a different feature, or the change is illegible, answer MISMATCH; if there is no cold lens, answer UNKNOWN. Then run with Bash: ${SEP} mark ${e} ${u} intent_match=<MATCH|MISMATCH|UNKNOWN> and return that command's JSON.`, { label: `S7 back-translation ${u}`, schema: RUN, effort: 'low' })
      stage = 'decide'
    }
    if (stage === 'decide') {
      const d = await run(`${SEP} decide ${e} ${u}`, `S8 decide ${u}`)
      const act = d && d.action
      log(`${u}: verdict ${act} → ${d && d.target} (row ${d && d.row}: ${d && d.why})`)
      if (act === 'MERGE') stage = 'merge'
      else if (act === 'SENDBACK' && d.target === 'S5') { stage = 'execute'; unit.round = (unit.round || 0) + 1; continue }
      else if (act === 'PROMOTE') { stage = 'inspect'; continue }
      else if (act === 'RERUN-BLIND') { stage = 'blind'; continue }
      else if (act === 'SENDBACK') return { unit: u, stopped: 'sendback', target: d.target, why: d.why }
      else stage = 'card'
    }
    if (stage === 'merge') {
      const m = await run(`${SEP} merge ${e} ${u}`, `S8 merge ${u}`)
      if (m && m.merged) return { unit: u, merged: true }
      if (m && m.conflict) { const d = await run(`${SEP} decide ${e} ${u}`, `decide ${u} after conflict`); if (d && d.action === 'SENDBACK') { stage = 'execute'; unit.round = (unit.round || 0) + 1; continue } }
      return { unit: u, stopped: 'merge failed', detail: m }
    }
    if (stage === 'card') { const c = await run(`${SEP} card ${e} ${u}`, `S8 card ${u}`); return { unit: u, stopped: 'human', card: c } }
    return { unit: u, stopped: `unknown stage ${stage}` }
  }
  return { unit: u, stopped: 'cycle limit' }
}

const LEARN_OUT = { type: 'object', properties: { lessons_added: { type: 'array', items: { type: 'string' } }, proposals: { type: 'array', items: { type: 'string' } } }, required: ['lessons_added', 'proposals'] }
async function stepLearn(e, n) {
  phase('Learn')
  if ((n.merged || []).length) { const ic = await run(`${SEP} check-integration ${e}`, 'S9 integration check'); log(`integration check: ${ic && ic.ok ? 'PASS' : 'FAIL'}`) }
  await role('sep-learner', `Epic ${e} finished: merged ${JSON.stringify(n.merged)}, parked ${JSON.stringify(n.parked)}. Read .separator/metrics.jsonl (lines for this epic), .separator/epics/${e}/units/*/defects/*.json, decision.json files and merge-cards. If there were send-backs, escapes or rulings, append at most 3 one-line lessons to .separator/lessons.md (keep the file ≤ 60 lines; dedupe; a lesson names the layer that should have caught the defect) and ADR-lite lines to .separator/decisions.md for decisions taken. If nothing was learned, write nothing. Never edit zones.json floors yourself; propose them.`, { label: 'S9 learn', schema: LEARN_OUT, effort: 'low' })
  return run(`${SEP} mark ${e} stage=done`, 'S9 done')
}

// -------------------------------------------------------------------------------------------------
// main loop
// -------------------------------------------------------------------------------------------------
let epic = args.epic
if (!epic) {
  if (!args.request) throw new Error('pass {request:"..."} or {epic:"<id>"}')
  const created = await run(`${SEP} epic new ${JSON.stringify(args.request)}`, 'S0 new epic')
  epic = created && created.epic
  if (!epic) throw new Error('could not create the epic: ' + JSON.stringify(created))
  log(`epic ${epic} created`)
}
const trail = []
for (let i = 0; i < MAX_ITER; i++) {
  const n = await run(`${SEP} next ${epic}`, 'next')
  const step = n && n.step
  trail.push(step)
  if (!step) return { epic, status: 'error', detail: n, trail }
  if (step === 'done') return { epic, status: 'done', merged: n.merged, parked: n.parked, trail }
  if (step === 'ask' || step === 'human') return { epic, status: step, gate: n.gate, questions: n.questions, units: n.units, file: n.file, hint: step === 'ask' ? `answer with: ${SEP} answer ${epic} "<answers>" then re-run with {epic:"${epic}"}` : `approve with: ${SEP} approve ${epic} [<unit>|--contracts] then re-run with {epic:"${epic}"}`, trail }
  if (step === 'triage') { const r = await stepTriage(epic, n); if (r && r.fatal) return { epic, status: 'error', detail: r.fatal, trail } }
  else if (step === 'classify') await run(`${SEP} epic classify ${epic}`, 'S0 classify')
  else if (step === 'cartography') await stepCartography(epic, n)
  else if (step === 'plan') { const r = await stepPlan(epic, n); if (r && r.fatal) return { epic, status: 'error', detail: r.fatal, trail } }
  else if (step === 'replan') { const r = await stepPlan(epic, n, n.units); if (r && r.fatal) return { epic, status: 'error', detail: r.fatal, trail } }
  else if (step === 'audit') await stepAudit(epic)
  else if (step === 'spike') await stepSpike(epic, n.units)
  else if (step === 'units') { const rs = await pipeline(n.units, u => unitCycle(epic, u, n.lane)); log(`wave: ${rs.filter(Boolean).map(r => `${r.unit}:${r.merged ? 'merged' : r.stopped}`).join(', ')}`) }
  else if (step === 'merge') for (const u of n.units) await run(`${SEP} merge ${epic} ${u}`, `merge ${u}`)
  else if (step === 'learn') await stepLearn(epic, n)
  else return { epic, status: 'error', detail: `unknown step ${step}`, trail }
}
return { epic, status: 'iteration-limit', trail }
