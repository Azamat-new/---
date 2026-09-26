#!/usr/bin/env node
'use strict';
/*
 * sep — the Separator CLI. Zero dependencies, Node >= 18, CommonJS on purpose (works whatever the
 * repository's package.json "type" is). It implements the MECHANICAL parts of the funnel: artifact
 * directories, role markers, evidence recording, the mechanical gate, blind sandboxes, the headless
 * blind-lens launcher, the decision table, counters and the enforcement hooks. Agents never write the
 * files this tool owns (gate.json, decision.json, state.json, schedule.json, manifest.json).
 *
 *   node .separator/bin/sep.cjs <command> [args]        (or: .separator/bin/sep <command>)
 *
 * Commands are listed by `sep help`.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const os = require('os');

// ---------------------------------------------------------------------------------------------
// paths
// ---------------------------------------------------------------------------------------------
function sh(cmd, opts = {}) {
  const r = cp.spawnSync(cmd, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  return { code: r.status === null ? 124 : r.status, out: (r.stdout || '') + (r.stderr || ''), stdout: r.stdout || '', stderr: r.stderr || '' };
}
function git(args, cwd) {
  const r = cp.spawnSync('git', args, { cwd: cwd || ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function findRoot() {
  if (process.env.SEP_ROOT) return path.resolve(process.env.SEP_ROOT);
  if (process.env.CLAUDE_PROJECT_DIR) return path.resolve(process.env.CLAUDE_PROJECT_DIR);
  // inside a worktree, git-common-dir points at the main checkout's .git
  const r = cp.spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' });
  if (r.status === 0 && r.stdout.trim()) return path.dirname(r.stdout.trim());
  return process.cwd();
}
const ROOT = findRoot();
const SEP = path.join(ROOT, '.separator');
const EPICS = path.join(SEP, 'epics');
const SELF = path.resolve(__filename);

const epicDir = (e) => path.join(EPICS, e);
const unitDir = (e, u) => path.join(EPICS, e, 'units', u);
const branchOf = (e, u) => `sep/${e}/${u}`;

// ---------------------------------------------------------------------------------------------
// small utils
// ---------------------------------------------------------------------------------------------
const readJSON = (p, dflt) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { if (dflt !== undefined) return dflt; throw new Error(`cannot read JSON ${p}: ${e.message}`); } };
const writeJSON = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); };
const exists = (p) => fs.existsSync(p);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const nowISO = () => new Date().toISOString();
const rid = (n = 6) => crypto.randomBytes(n).toString('hex');
function appendLine(p, line) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.appendFileSync(p, line + '\n'); }
function out(obj) { process.stdout.write(JSON.stringify(obj, null, 2) + '\n'); }
function fail(msg, code = 1) { process.stderr.write(`sep: ${msg}\n`); process.exit(code); }
function parseArgs(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { pos.push(...argv.slice(i + 1)); break; }
    if (a.startsWith('--')) { const k = a.slice(2); const v = (i + 1 < argv.length && !argv[i + 1].startsWith('--')) ? argv[++i] : true; opt[k] = v; }
    else pos.push(a);
  }
  return { pos, opt };
}

// glob → regex. Supports **, *, ?, {a,b}. Anchored. Paths use forward slashes.
function globToRe(g) {
  let re = '^';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') { i++; if (g[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') { const j = g.indexOf('}', i); if (j < 0) { re += '\\{'; continue; } re += '(?:' + g.slice(i + 1, j).split(',').map(s => s.replace(/[.+^$()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')).join('|') + ')'; i = j; }
    else if ('.+^$()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp(re + '$');
}
const matchAny = (rel, globs) => (globs || []).some(g => globToRe(g).test(rel));
function relToRoot(p, base) { const abs = path.isAbsolute(p) ? p : path.resolve(base || ROOT, p); return path.relative(base || ROOT, abs).split(path.sep).join('/'); }

// ---------------------------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------------------------
const DEFAULT_POLICY = {
  version: 1,
  lanes: {
    T0: { max_files: 3, max_lines: 80, sendbacks_execute: 1, calls: 4, effort: 'low', blind_lenses: ['cold'], inspect_lenses: [] },
    T1: { max_files: 8, max_lines: 300, sendbacks_execute: 2, calls: 12, effort: 'medium', blind_lenses: ['customer'], inspect_lenses: ['correctness'] },
    T2: { max_files: 20, max_lines: 800, sendbacks_execute: 2, calls: 24, effort: 'high', blind_lenses: ['customer', 'cold'], inspect_lenses: ['correctness', 'blast-radius'] },
    T3: { max_files: 40, max_lines: 2000, sendbacks_execute: 3, calls: 40, effort: 'high', blind_lenses: ['customer', 'cold', 'security'], inspect_lenses: ['correctness', 'blast-radius'] },
  },
  counters: { exec_retries: 1, sendbacks_contract: { T0: 0, T1: 1, T2: 2, T3: 2 }, sendbacks_decompose: { T0: 0, T1: 1, T2: 1, T3: 1 }, sendbacks_intake: 1, integration_rounds: 2, human_escalations: 3 },
  gate: { mutants: true, max_mutants: 3, max_gate_seconds: 600, skip_markers: true, secrets: true },
  hazard_classes: ['auth', 'authz', 'data-loss', 'migration', 'concurrency', 'secrets', 'pii', 'performance-hot-path', 'irreversible-external'],
  strip: ['CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md', '.claude/**', '.separator/**', '.cursor/**', '.github/copilot*', 'docs/decisions/**', 'CHANGELOG*', '**/PULL_REQUEST_TEMPLATE*', '.env*', '**/secrets/**', '.githooks/**'],
  frozen_globs: ['**/acc_*', '**/regress_*'],
  blind: { model: '', max_turns: 30, timeout_seconds: 900, launcher: 'claude' },
  integration_branch: 'integration',
  notify: 'terminal',
};
const DEFAULT_ZONES = {
  version: 1,
  risk_paths: [{ glob: '**/migrations/**', floor: 'T2' }, { glob: '**/auth/**', floor: 'T2' }, { glob: '**/billing/**', floor: 'T2' }, { glob: '**/*.lock', floor: 'T2' }, { glob: '**/package-lock.json', floor: 'T2' }],
  zones: [],
  default: { id: 'default', paths: ['**'], lang: null, commands: { setup: null, build: null, test: null, fast: null, lint: null, run: null, mutate: null }, test_globs: ['**/test/**', '**/tests/**', '**/*.test.*', '**/*_test.*', '**/*.spec.*'], serialized_resources: [], invariants: [], persona: '', risk_floor: 'T1', confidence: 'inferred', suite_seconds: null },
};
const policy = () => Object.assign({}, DEFAULT_POLICY, readJSON(path.join(SEP, 'policy.json'), {}));
const zonesCfg = () => readJSON(path.join(SEP, 'zones.json'), DEFAULT_ZONES);
function zoneFor(rel) {
  const z = zonesCfg();
  for (const zone of z.zones || []) if (matchAny(rel, zone.paths)) return zone;
  return Object.assign({ id: 'default' }, z.default || DEFAULT_ZONES.default);
}
function zoneById(id) { const z = zonesCfg(); return (z.zones || []).find(x => x.id === id) || Object.assign({ id: 'default' }, z.default || DEFAULT_ZONES.default); }
const CLASSES = ['T0', 'T1', 'T2', 'T3'];
const classMax = (...cs) => CLASSES[Math.max(...cs.map(c => Math.max(0, CLASSES.indexOf(c || 'T0'))))];

// ---------------------------------------------------------------------------------------------
// unit context (used by hooks and by unit-start)
// ---------------------------------------------------------------------------------------------
function unitContext(cwd) {
  try {
    const marker = path.join(cwd, '.sep-role');
    if (exists(marker)) { const m = readJSON(marker); if (m && m.epic && m.unit) return m; }
    const b = git(['branch', '--show-current'], cwd);
    const mm = /^sep\/([^/]+)\/([^/]+)$/.exec(b.out || '');
    if (mm) return { role: 'unknown', epic: mm[1], unit: mm[2] };
  } catch (e) { /* not a git dir */ }
  return null;
}
function loadCard(e, u) { return readJSON(path.join(unitDir(e, u), 'card.json'), null); }
function loadState(e) { return readJSON(path.join(epicDir(e), 'state.json'), { epic: e, stage: 'intake', units: {}, human_escalations: 0, waves_done: [], events: [] }); }
function saveState(e, s) { writeJSON(path.join(epicDir(e), 'state.json'), s); }
function unitState(s, u) { s.units[u] = s.units[u] || { stage: 'planned', attempt: 0, exec_retries: 0, sendbacks: { execute: 0, contract: 0, decompose: 0, intake: 0 }, integration_rounds: 0, sigs_seen: [], calls: 0, merged: false, blind_reruns: 0 }; return s.units[u]; }
function metric(e, u, obj) { appendLine(path.join(SEP, 'metrics.jsonl'), JSON.stringify(Object.assign({ ts: nowISO(), epic: e, unit: u || null }, obj))); }

// ---------------------------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------------------------
const commands = {};

commands.help = () => {
  process.stdout.write(`sep — Separator CLI (mechanical parts of the funnel)

  init [--force]                       create .separator/ (policy, zones, ledgers) and .claude hooks if missing
  status [--json]                      board: epics × stage, parked units, pending human cards
  epic new "<request text>" [--id x]   new epic dir with request.md + state.json; prints epic id
  epic classify <epic>                 deterministic class from triage.json + zones (agent may only raise)
  plan check <epic>                    validate dag.json (acyclic, disjoint write-sets, sizes), write schedule.json
  unit start <epic> <unit> --role r    inside an isolated worktree: checkout sep/<epic>/<unit>, write .sep-role
  unit run <epic> <unit> -- <cmd>      run a command, record it in evidence.json (evidence, not claims)
  unit finish <epic> <unit>            neutral commit of the worktree, record head sha
  unit packet <epic> <unit> [--for r]  everything a role may know about the unit (card, zone, spike, defects, rulings)
  unit note <epic> <unit> "<text>"     append to the unit's notes.md (what the next attempt should know)
  mark <epic> [<unit>] k=v             set a driver-settable flag (audited, stage, class, ...)
  gate <epic> <unit> [--no-mutants]    mechanical gate on branch sep/<epic>/<unit> → gate.json (exit 1 on fail)
  sandbox <epic> <unit> [--lens l]     build a physically blind sandbox (2 neutral commits) → manifest.json
  blind <epic> <unit> --lens l         run a context-free lens headless in the sandbox → blind-<l>.json
  ratchet <epic> <unit> <findings.json> record sigs, copy repros into tests/regress_<sig>, defect cards
  decide <epic> <unit>                 decision table → decision.json; prints {action, target}
  merge <epic> <unit>                  verify decision hash, merge sep/<epic>/<unit> into integration
  card <epic> <unit>                   render the one-screen merge card / stuck card (markdown)
  next <epic>                          what to do next (the state machine every driver follows)
  answer <epic> "<text>"               record the human's answers / ruling (H0, H3)
  approve <epic> [<unit>] [--contracts] human approval: H1 contracts or H2 merge card; --kill kills the epic
  check-integration <epic>             run zone tests + invariants on the integration branch
  hook <guard>                         hook entry (stdin JSON): guard-write | guard-bash | guard-blind
  lint                                 check workflows (parse), agents (frontmatter), skills, schemas, settings
  selftest                             prove the harness: hooks deny, sandbox is blind, gate fails a planted bug
  validate <file> --schema <name>      validate a JSON artifact against .separator/schemas/<name>.json
`);
};

// --- init ------------------------------------------------------------------------------------
commands.init = ({ opt }) => {
  fs.mkdirSync(SEP, { recursive: true });
  const created = [];
  const put = (rel, content) => { const p = path.join(ROOT, rel); if (!exists(p) || opt.force) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); created.push(rel); } };
  put('.separator/policy.json', JSON.stringify(DEFAULT_POLICY, null, 2) + '\n');
  put('.separator/zones.json', JSON.stringify(inferZones(), null, 2) + '\n');
  put('.separator/rulings.md', '# Rulings (append-only; pasted into every later stage)\n');
  put('.separator/decisions.md', '# Decisions (ADR-lite: Context / Decision / Consequence / Revisit-when)\n');
  put('.separator/lessons.md', '# Lessons (max 60 lines; the only memory CLAUDE.md imports)\n');
  put('.separator/metrics.jsonl', '');
  put('.separator/escapes.jsonl', '');
  // gitignore
  const gi = path.join(ROOT, '.gitignore');
  const lines = exists(gi) ? fs.readFileSync(gi, 'utf8').split('\n') : [];
  const need = ['.separator/epics/', '.separator/locks.json', '.separator/selftest.json', '.claude/worktrees/', '.sep-role'];
  const add = need.filter(l => !lines.includes(l));
  if (add.length) { fs.appendFileSync(gi, (lines.length && lines[lines.length - 1] !== '' ? '\n' : '') + '# separator (run artifacts must never be committed: blind sandboxes are built from git)\n' + add.join('\n') + '\n'); created.push('.gitignore (+' + add.length + ')'); }
  git(['config', 'core.hooksPath', '.githooks']);
  out({ root: ROOT, created, next: ['restart Claude Code so .claude/agents are registered', 'run: sep selftest', 'declare zones in .separator/zones.json (confidence: declared)'] });
};

function inferZones() {
  const z = JSON.parse(JSON.stringify(DEFAULT_ZONES));
  const has = (f) => exists(path.join(ROOT, f));
  const cmds = z.default.commands;
  if (has('package.json')) {
    const pkg = readJSON(path.join(ROOT, 'package.json'), {});
    const s = pkg.scripts || {};
    z.default.lang = 'javascript';
    cmds.test = s.test ? 'npm test' : null; cmds.lint = s.lint ? 'npm run lint' : null; cmds.build = s.build ? 'npm run build' : null; cmds.fast = s.lint ? 'npm run lint' : (s.test ? 'npm test' : null);
  } else if (has('pyproject.toml') || has('setup.py') || has('requirements.txt')) {
    z.default.lang = 'python'; cmds.test = 'python -m pytest -q'; cmds.fast = 'python -m pytest -q -x';
  } else if (has('go.mod')) { z.default.lang = 'go'; cmds.test = 'go test ./...'; cmds.build = 'go build ./...'; cmds.lint = 'go vet ./...'; cmds.fast = 'go vet ./...'; }
  else if (has('Cargo.toml')) { z.default.lang = 'rust'; cmds.test = 'cargo test'; cmds.build = 'cargo build'; cmds.lint = 'cargo clippy -q'; cmds.fast = 'cargo check -q'; }
  else if (has('pom.xml')) { z.default.lang = 'java'; cmds.test = 'mvn -q test'; cmds.build = 'mvn -q compile'; }
  else if (has('Makefile')) { const mk = fs.readFileSync(path.join(ROOT, 'Makefile'), 'utf8'); if (/^test:/m.test(mk)) cmds.test = 'make test'; if (/^lint:/m.test(mk)) cmds.lint = 'make lint'; if (/^build:/m.test(mk)) cmds.build = 'make build'; }
  z.default.confidence = 'inferred';
  return z;
}

// --- status ----------------------------------------------------------------------------------
commands.status = ({ opt }) => {
  const rows = [];
  if (exists(EPICS)) for (const e of fs.readdirSync(EPICS)) {
    const st = loadState(e);
    const units = Object.entries(st.units || {}).map(([u, s]) => `${u}:${s.stage}${s.merged ? '✓' : ''}${s.parked ? '⏸' : ''}`);
    const cards = exists(path.join(epicDir(e), 'merge-cards')) ? fs.readdirSync(path.join(epicDir(e), 'merge-cards')) : [];
    rows.push({ epic: e, stage: st.stage, class: st.class || null, units, pending_cards: cards, questions: exists(path.join(epicDir(e), 'questions.md')) && !exists(path.join(epicDir(e), 'answers.md')) });
  }
  if (opt.json) return out(rows);
  if (!rows.length) return process.stdout.write('no epics. start one: sep epic new "<request>"\n');
  for (const r of rows) process.stdout.write(`${r.epic}  [${r.stage}${r.class ? ' ' + r.class : ''}]  ${r.units.join(' ') || '-'}${r.pending_cards.length ? '  cards: ' + r.pending_cards.join(',') : ''}${r.questions ? '  QUESTIONS PENDING' : ''}\n`);
};

// --- epic ------------------------------------------------------------------------------------
commands.epic = ({ pos, opt }) => {
  const sub = pos[0];
  if (sub === 'new') {
    const text = pos.slice(1).join(' ').trim();
    if (!text) fail('usage: sep epic new "<request text>"');
    const slug = text.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '').slice(0, 24) || 'epic';
    const id = opt.id || `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${slug}-${rid(2)}`;
    const d = epicDir(id);
    if (exists(d)) fail(`epic ${id} exists`);
    fs.mkdirSync(path.join(d, 'units'), { recursive: true });
    fs.writeFileSync(path.join(d, 'request.md'), text + '\n');
    const base = git(['rev-parse', 'HEAD']).out;
    saveState(id, { epic: id, stage: 'intake', class: null, base_sha: base, canary: `SEP-CANARY-${rid(4)}`, units: {}, human_escalations: 0, waves_done: [], created: nowISO() });
    metric(id, null, { stage: 'intake', event: 'epic_new' });
    return out({ epic: id, dir: d, base_sha: base });
  }
  if (sub === 'classify') {
    const e = pos[1]; if (!e) fail('usage: sep epic classify <epic>');
    const tri = readJSON(path.join(epicDir(e), 'triage.json'), {});
    const z = zonesCfg();
    const paths = tri.est_paths || [];
    let floor = 'T0';
    const signals = [];
    for (const p of paths) {
      for (const rp of z.risk_paths || []) if (globToRe(rp.glob).test(p)) { floor = classMax(floor, rp.floor); signals.push(`risk_path:${rp.glob}`); }
      const zone = zoneFor(p); floor = classMax(floor, zone.risk_floor || 'T0');
    }
    const zonesTouched = new Set(paths.map(p => zoneFor(p).id));
    if (zonesTouched.size > 1) { floor = classMax(floor, 'T1'); signals.push('multi_zone'); }
    if (zonesTouched.size > 2) { floor = classMax(floor, 'T2'); }
    if ((tri.est_lines || 0) > 400) { floor = classMax(floor, 'T2'); signals.push('est_lines>400'); }
    if ((tri.est_files || 0) > 8) { floor = classMax(floor, 'T2'); signals.push('est_files>8'); }
    if (tri.irreversible) { floor = classMax(floor, 'T3'); signals.push('irreversible'); }
    if ((tri.unknowns || []).length && floor === 'T0') { floor = 'T1'; signals.push('unknowns'); }
    const cls = classMax(floor, tri.class || 'T0');
    const unmapped = paths.filter(p => { const zn = zoneFor(p); return zn.id === 'default' || zn.confidence === 'unmapped'; });
    const st = loadState(e); st.class = cls; st.class_floor = floor; st.stage = 'classified'; st.unmapped_paths = unmapped; saveState(e, st);
    tri.class_final = cls; tri.class_floor = floor; tri.floor_signals = signals; writeJSON(path.join(epicDir(e), 'triage.json'), tri);
    metric(e, null, { stage: 'intake', event: 'classified', class: cls });
    return out({ epic: e, class: cls, floor, signals, unmapped, lane: policy().lanes[cls] });
  }
  fail('usage: sep epic new|classify');
};

// --- plan check -------------------------------------------------------------------------------
commands.plan = ({ pos }) => {
  if (pos[0] !== 'check') fail('usage: sep plan check <epic>');
  const e = pos[1]; const dag = readJSON(path.join(epicDir(e), 'dag.json'));
  const pol = policy(); const st = loadState(e); const lane = pol.lanes[st.class || 'T1'];
  const errors = [];
  const units = dag.units || [];
  if (!units.length) errors.push('no units');
  if (units.length > 12) errors.push(`too many units (${units.length} > 12): split the epic`);
  const ids = new Set(units.map(u => u.id));
  for (const u of units) {
    if (!u.id || !/^[A-Za-z0-9_-]+$/.test(u.id)) errors.push(`bad unit id ${u.id}`);
    if (!(u.writes || []).length) errors.push(`${u.id}: empty write-set`);
    if (!(u.checks || []).length) errors.push(`${u.id}: no acceptance check`);
    for (const d of u.depends_on || []) if (!ids.has(d)) errors.push(`${u.id}: unknown dependency ${d}`);
    if ((u.est_files || 0) > lane.max_files) errors.push(`${u.id}: est_files ${u.est_files} > lane ${lane.max_files}`);
    if ((u.est_lines || 0) > lane.max_lines) errors.push(`${u.id}: est_lines ${u.est_lines} > lane ${lane.max_lines}`);
  }
  // topological waves (Kahn)
  const indeg = {}; units.forEach(u => indeg[u.id] = (u.depends_on || []).length);
  const waves = []; let remaining = units.slice();
  while (remaining.length) {
    const ready = remaining.filter(u => indeg[u.id] === 0);
    if (!ready.length) { errors.push('cycle in dag'); break; }
    // disjoint write-sets within a wave: overlapping units are serialized into the next wave
    const wave = []; const taken = [];
    for (const u of ready) {
      const clash = taken.some(t => t.some(g => (u.writes || []).some(w => g === w || globToRe(g).test(w) || globToRe(w).test(g))));
      const serialClash = (u.serialized || []).some(s => wave.some(w => (w.serialized || []).includes(s)));
      if (clash || serialClash) continue;
      wave.push(u); taken.push(u.writes || []);
    }
    if (!wave.length) { errors.push('unschedulable: every ready unit overlaps'); break; }
    waves.push(wave.map(u => u.id));
    remaining = remaining.filter(u => !wave.includes(u));
    for (const u of wave) for (const v of remaining) if ((v.depends_on || []).includes(u.id)) indeg[v.id]--;
  }
  // coverage vs ACCEPTANCE ids
  const acc = exists(path.join(epicDir(e), 'ACCEPTANCE.md')) ? [...fs.readFileSync(path.join(epicDir(e), 'ACCEPTANCE.md'), 'utf8').matchAll(/^-\s*(A\d+)\b/gm)].map(m => m[1]) : [];
  const covered = new Set(units.flatMap(u => u.acceptance || []));
  const missing = acc.filter(a => !covered.has(a));
  if (missing.length) errors.push(`acceptance criteria without a unit: ${missing.join(', ')}`);
  const schedule = { epic: e, class: st.class, waves, wip_limit: Math.min(5, units.length), lane, generated: nowISO() };
  if (errors.length) { st.stage = 'plan_failed'; st.plan_failures = (st.plan_failures || 0) + 1; st.plan_errors = errors; saveState(e, st); }
  if (!errors.length) {
    st.plan_errors = null;
    writeJSON(path.join(epicDir(e), 'schedule.json'), schedule);
    for (const u of units) { const d = unitDir(e, u.id); const prev = st.units[u.id]; if (prev && (prev.merged || prev.parked)) continue; fs.mkdirSync(path.join(d, 'tests'), { recursive: true }); writeJSON(path.join(d, 'card.json'), Object.assign({ base_sha: st.base_sha, epic: e, class: u.class || st.class, canary: st.canary }, u)); const us = unitState(st, u.id); if (us.stage === 'replan' || us.stage === 'spike') { us.stage = 'planned'; us.round = 0; } }
    for (const [uid, us] of Object.entries(st.units)) if (!units.some(x => x.id === uid) && !us.merged) us.stage = 'dropped';
    st.stage = 'planned'; saveState(e, st);
  }
  metric(e, null, { stage: 'decompose', event: 'plan_check', ok: !errors.length, units: units.length, waves: waves.length });
  out({ ok: !errors.length, errors, waves, missing_acceptance: missing });
  if (errors.length) process.exit(1);
};

// --- unit start / run / finish ---------------------------------------------------------------
commands.unit = ({ pos, opt }) => {
  const sub = pos[0], e = pos[1], u = pos[2];
  if (!e || !u) fail('usage: sep unit start|run|finish <epic> <unit>');
  const card = loadCard(e, u); if (!card) fail(`no card for ${e}/${u} (run sep plan check first)`);
  const cwd = process.cwd();
  if (sub === 'start') {
    const role = opt.role || 'executor';
    const top = git(['rev-parse', '--show-toplevel'], cwd).out;
    if (path.resolve(top) === path.resolve(ROOT) && !opt['allow-main']) fail('unit start must run inside an isolated worktree, not the main checkout (agents: isolation: worktree)');
    const br = branchOf(e, u);
    const has = git(['rev-parse', '--verify', '--quiet', br], cwd).code === 0;
    const r = has ? git(['checkout', '-q', br], cwd) : git(['checkout', '-q', '-b', br, card.base_sha], cwd);
    if (r.code !== 0) fail(`checkout failed: ${r.err}`);
    writeJSON(path.join(cwd, '.sep-role'), { role, epic: e, unit: u, worktree: cwd, started: nowISO() });
    const excl = git(['rev-parse', '--git-path', 'info/exclude'], cwd).out;
    try { const cur = exists(excl) ? fs.readFileSync(excl, 'utf8') : ''; if (!cur.includes('.sep-role')) { fs.mkdirSync(path.dirname(excl), { recursive: true }); fs.appendFileSync(excl, '\n.sep-role\n'); } } catch (_) { }
    const st = loadState(e); const us = unitState(st, u); us.stage = role === 'prober' ? 'spike' : 'execute'; us.attempt++; saveState(e, st);
    metric(e, u, { stage: us.stage, event: 'unit_start', role, attempt: us.attempt });
    const zone = zoneById(card.zone);
    return out({ branch: br, base_sha: card.base_sha, role, writes: card.writes, test_writes: card.test_writes || [], zone: zone.id, commands: zone.commands, checks: card.checks });
  }
  if (sub === 'run') {
    const cmd = pos.slice(3).join(' ');
    if (!cmd) fail('usage: sep unit run <epic> <unit> -- <cmd>');
    const t0 = Date.now(); const r = sh(cmd, { cwd });
    const evP = path.join(unitDir(e, u), 'evidence.json');
    const ev = readJSON(evP, { unit: u, commands: [], status: 'in_progress' });
    ev.commands.push({ cmd, exit: r.code, stdout_sha: sha256(r.out), ms: Date.now() - t0, tail: r.out.slice(-800), at: nowISO() });
    writeJSON(evP, ev);
    process.stdout.write(r.out);
    process.stdout.write(`\n[sep] recorded: exit=${r.code}\n`);
    process.exit(r.code);
  }
  if (sub === 'finish') {
    const ctx = unitContext(cwd); if (!ctx || ctx.unit !== u) fail('finish must run inside the unit worktree (after sep unit start)');
    git(['add', '-A'], cwd);
    const n = (git(['rev-list', '--count', `${card.base_sha}..HEAD`], cwd).out | 0) + 1;
    const c = git(['-c', 'user.name=separator', '-c', 'user.email=separator@local', 'commit', '-q', '--allow-empty', '-m', `${u} change set ${n}`], cwd);
    if (c.code !== 0) fail(`commit failed: ${c.err}`);
    const head = git(['rev-parse', 'HEAD'], cwd).out;
    const evP = path.join(unitDir(e, u), 'evidence.json');
    const ev = readJSON(evP, { unit: u, commands: [] });
    ev.head_sha = head; ev.status = opt.status || 'pass'; ev.files_touched = git(['diff', '--name-only', `${card.base_sha}..HEAD`], cwd).out.split('\n').filter(Boolean); ev.finished = nowISO();
    writeJSON(evP, ev);
    const st = loadState(e); const us = unitState(st, u); us.head_sha = head; us.stage = ctx.role === 'prober' ? 'spiked' : 'executed'; saveState(e, st);
    if (ctx.role === 'prober') { card.tests_sha = head; writeJSON(path.join(unitDir(e, u), 'card.json'), card); }
    metric(e, u, { stage: us.stage, event: 'unit_finish', head, files: ev.files_touched.length, commands: ev.commands.length });
    return out({ head_sha: head, files_touched: ev.files_touched, commands_recorded: ev.commands.length });
  }
  if (sub === 'packet') {
    const d = unitDir(e, u); const zone = zoneById(card.zone);
    const st = loadState(e); const us = unitState(st, u);
    const defects = exists(path.join(d, 'defects')) ? fs.readdirSync(path.join(d, 'defects')).map(f => readJSON(path.join(d, 'defects', f))) : [];
    const pk = { epic: e, unit: u, role: opt.for || 'executor', class: us.class || card.class, round: us.round || 0, branch: branchOf(e, u), base_sha: card.base_sha, card, zone: { id: zone.id, commands: zone.commands, test_globs: zone.test_globs, invariants: zone.invariants, persona: zone.persona },
      acceptance: exists(path.join(epicDir(e), 'ACCEPTANCE.md')) ? fs.readFileSync(path.join(epicDir(e), 'ACCEPTANCE.md'), 'utf8') : null,
      spike: readJSON(path.join(d, 'spike.json'), null), defects, notes: exists(path.join(d, 'notes.md')) ? fs.readFileSync(path.join(d, 'notes.md'), 'utf8') : null,
      rulings: exists(path.join(SEP, 'rulings.md')) ? fs.readFileSync(path.join(SEP, 'rulings.md'), 'utf8').split('\n').filter(l => l.startsWith('- ')).slice(-20) : [],
      lessons: exists(path.join(SEP, 'lessons.md')) ? fs.readFileSync(path.join(SEP, 'lessons.md'), 'utf8').split('\n').filter(l => l.startsWith('- ')).slice(-20) : [] };
    if ((opt.for || '') === 'inspector') { pk.gate = readJSON(path.join(d, 'gate.json'), null); pk.evidence = readJSON(path.join(d, 'evidence.json'), null); pk.diff_stat = git(['diff', '--stat', `${card.base_sha}..${branchOf(e, u)}`]).out; pk.prior_inspections = fs.readdirSync(d).filter(f => /^inspect-.*\.json$/.test(f)).map(f => readJSON(path.join(d, f))); }
    if ((opt.for || '') === 'prober') { delete pk.defects; }
    return out(pk);
  }
  if (sub === 'note') {
    const text = pos.slice(3).join(' '); if (!text) fail('usage: sep unit note <epic> <unit> "<text>"');
    fs.appendFileSync(path.join(unitDir(e, u), 'notes.md'), `- [${nowISO()}] ${text}\n`); return out({ ok: true });
  }
  fail('usage: sep unit start|run|finish|packet|note');
};

// --- mark: sanctioned way for a driver to set simple state flags -------------------------------
commands.mark = ({ pos }) => {
  const e = pos[0]; if (!e) fail('usage: sep mark <epic> [<unit>] key=value ...');
  const st = loadState(e); let target = st; let rest = pos.slice(1);
  if (rest.length && !rest[0].includes('=')) { target = unitState(st, rest[0]); rest = rest.slice(1); }
  const ALLOWED = new Set(['audited', 'acknowledged_parked', 'stage', 'class', 'intent_match', 'contracts_packet', 'parked', 'spike_verdict']);
  const set = {};
  for (const kv of rest) { const [k, v] = kv.split('='); if (!ALLOWED.has(k)) fail(`key ${k} is not settable by drivers`); target[k] = v === 'true' ? true : v === 'false' ? false : v === 'null' ? null : v; set[k] = target[k]; if (k === 'parked' && v === 'null') delete target.parked; }
  saveState(e, st); out({ ok: true, set });
};

// --- gate ------------------------------------------------------------------------------------
function withWorktree(ref, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sep-wt-'));
  const a = git(['worktree', 'add', '--detach', '-q', tmp, ref]);
  if (a.code !== 0) { fs.rmSync(tmp, { recursive: true, force: true }); throw new Error(`worktree add failed: ${a.err}`); }
  try { return fn(tmp); } finally { git(['worktree', 'remove', '--force', tmp]); fs.rmSync(tmp, { recursive: true, force: true }); }
}
function runCmd(cmd, cwd, timeoutSec) {
  if (!cmd) return { cmd, skipped: true, ok: true };
  const t0 = Date.now(); const r = sh(cmd, { cwd, timeout: (timeoutSec || 600) * 1000 });
  return { cmd, exit: r.code, ok: r.code === 0, ms: Date.now() - t0, tail: r.out.slice(-1500) };
}
const SKIP_RE = /(\.skip\(|\.only\(|\bxit\(|\bxdescribe\(|\bit\.todo\(|@pytest\.mark\.skip|@unittest\.skip|\bt\.Skip\(|#\[ignore\]|\bpending\(|@Disabled|@Ignore\b)/;
const SECRET_RES = [/AKIA[0-9A-Z]{16}/, /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bghp_[A-Za-z0-9]{30,}/, /\bxox[bpa]-[A-Za-z0-9-]{10,}/, /\bsk-[A-Za-z0-9]{20,}/, /(?:api[_-]?key|secret|token|password|passwd)\s*[:=]\s*['"][^'"\s]{8,}['"]/i];
const MUTATIONS = [
  { name: 'flip-comparison', re: /===|!==|==|!=|<=|>=|<|>/, apply: (l) => l.replace(/===/, '!==').replace(/^(.*?)!==(?!.*!==)/, (m) => m).replace(/\b==\b/, '!=').replace(/<=/, '>').replace(/>=/, '<') },
  { name: 'drop-branch', re: /\bif\s*\(/, apply: (l) => l.replace(/\bif\s*\(/, 'if (false && (') .replace(/\)\s*\{?\s*$/, (m) => ')' + m) },
  { name: 'return-constant', re: /\breturn\s+[^;]+;?/, apply: (l) => l.replace(/\breturn\s+[^;]+/, 'return null') },
  { name: 'flip-boolean', re: /\b(true|false)\b/, apply: (l) => l.replace(/\btrue\b/, 'false') },
];
commands.gate = ({ pos, opt }) => {
  const e = pos[0], u = pos[1]; if (!e || !u) fail('usage: sep gate <epic> <unit>');
  const card = loadCard(e, u); if (!card) fail('no card');
  const pol = policy(); const zone = zoneById(card.zone);
  const br = branchOf(e, u);
  const head = git(['rev-parse', br]); if (head.code !== 0) fail(`branch ${br} not found`);
  const base = card.base_sha;
  const gate = { unit: u, epic: e, head_sha: head.out, base_sha: base, pass: false, checks: {}, at: nowISO() };
  const t0 = Date.now();
  // 1. scope: every changed file ⊆ writes ∪ test_writes
  const changed = git(['diff', '--name-only', `${base}..${head.out}`]).out.split('\n').filter(Boolean);
  const addedFiles = new Set(git(['diff', '--name-only', '--diff-filter=A', `${base}..${head.out}`]).out.split('\n').filter(Boolean));
  const allowed = (card.writes || []).concat(card.test_writes || []);
  const RESERVED = ['**/acc_*', '**/regress_*'];
  const newTestOk = (f) => addedFiles.has(f) && matchAny(f, zone.test_globs || []) && !matchAny(f, RESERVED);
  const outside = changed.filter(f => !matchAny(f, allowed) && !newTestOk(f));
  gate.checks.scope = { ok: outside.length === 0, changed, outside };
  // 2. frozen tests: acc_/regress_ and zone test globs (except declared test_writes) must be identical since tests_sha (or base)
  const frozenGlobs = (pol.frozen_globs || []).concat(zone.test_globs || []);
  const since = card.tests_sha || base;
  // only MODIFIED/DELETED/RENAMED test files are frozen; adding a new test is always allowed (a survivor mutant is fixed by adding one)
  const frozenChanged = git(['diff', '--name-only', '--diff-filter=MDR', `${since}..${head.out}`]).out.split('\n').filter(Boolean).filter(f => matchAny(f, frozenGlobs) && !matchAny(f, card.test_writes || []));
  gate.checks.frozen = { ok: frozenChanged.length === 0, since, changed: frozenChanged };
  // 3. added lines: skip markers + secrets
  const added = git(['diff', '--unified=0', `${base}..${head.out}`]).out.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
  const skips = pol.gate.skip_markers ? added.filter(l => SKIP_RE.test(l)).slice(0, 10) : [];
  const secrets = pol.gate.secrets ? added.filter(l => SECRET_RES.some(r => r.test(l))).map(l => l.slice(0, 60) + '…').slice(0, 10) : [];
  gate.checks.skips = { ok: skips.length === 0, lines: skips };
  gate.checks.secrets = { ok: secrets.length === 0, lines: secrets };
  // 4. class recomputed from the actual diff
  const stat = git(['diff', '--shortstat', `${base}..${head.out}`]).out; const ins = +(stat.match(/(\d+) insertion/) || [0, 0])[1], del = +(stat.match(/(\d+) deletion/) || [0, 0])[1];
  const zonesTouched = new Set(changed.map(f => zoneFor(f).id));
  let actual = 'T0'; const lanes = pol.lanes;
  for (const c of CLASSES) { actual = c; if (changed.length <= lanes[c].max_files && ins + del <= lanes[c].max_lines) break; }
  for (const f of changed) for (const rp of zonesCfg().risk_paths || []) if (globToRe(rp.glob).test(f)) actual = classMax(actual, rp.floor);
  if (zonesTouched.size > 1) actual = classMax(actual, 'T1');
  gate.class_predicted = card.class; gate.class_actual = classMax(actual, ...[...zonesTouched].map(z => zoneById(z).risk_floor || 'T0'));
  gate.promoted = CLASSES.indexOf(gate.class_actual) > CLASSES.indexOf(card.class || 'T0');
  gate.diff = { files: changed.length, insertions: ins, deletions: del };
  gate.diff_sha256 = sha256(git(['diff', `${base}..${head.out}`]).out);
  // 5. commands in a temp worktree: setup, build, lint, contract checks, full tests, mutants
  withWorktree(head.out, (wt) => {
    const to = pol.gate.max_gate_seconds;
    gate.checks.setup = runCmd(zone.commands.setup, wt, to);
    gate.checks.build = runCmd(zone.commands.build, wt, to);
    gate.checks.lint = runCmd(zone.commands.lint, wt, to);
    gate.checks.contract = (card.checks || []).map(c => Object.assign({ id: c.id, maps_to: c.maps_to, kind: c.kind || 'check' }, c.kind === 'observation' ? { ok: true, skipped: true, note: 'observation: verified by a lens, never auto-merged' } : runCmd(c.cmd, wt, c.timeout || to)));
    gate.checks.tests = runCmd(zone.commands.test, wt, to);
    // flake control: a failing test command is re-run once; pass-on-retry is recorded as flaky, not as a pass
    if (gate.checks.tests.cmd && !gate.checks.tests.ok) { const again = runCmd(zone.commands.test, wt, to); gate.checks.tests.retry_ok = again.ok; gate.checks.tests.flaky = again.ok; }
    // mutants: mutate up to N changed source lines; each mutant must make the test command fail
    const wantMutants = pol.gate.mutants && !opt['no-mutants'] && zone.commands.test && gate.checks.tests.ok && (card.class || 'T1') !== 'T0';
    gate.checks.mutants = { applied: 0, killed: 0, survivors: [], skipped: !wantMutants };
    if (wantMutants) {
      const hunks = git(['diff', '--unified=0', `${base}..${head.out}`, '--', ...changed.filter(f => !matchAny(f, frozenGlobs) && !matchAny(f, zone.test_globs || []))]).out.split('\n');
      let file = null, ln = 0; const cands = [];
      for (const l of hunks) {
        if (l.startsWith('+++ b/')) { file = l.slice(6); continue; }
        const h = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(l); if (h) { ln = +h[1]; continue; }
        if (l.startsWith('+') && !l.startsWith('+++')) { const src = l.slice(1); if (file && !/^\s*(\/\/|#|\*|import |export \{|\})/.test(src) && src.trim().length > 3) { const m = MUTATIONS.find(x => x.re.test(src)); if (m) cands.push({ file, line: ln, src, m }); } ln++; }
      }
      for (const c of cands.slice(0, pol.gate.max_mutants || 3)) {
        const fp = path.join(wt, c.file); const orig = fs.readFileSync(fp, 'utf8').split('\n');
        const mutated = c.m.apply(orig[c.line - 1]); if (mutated === orig[c.line - 1]) continue;
        const copy = orig.slice(); copy[c.line - 1] = mutated; fs.writeFileSync(fp, copy.join('\n'));
        const r = runCmd(zone.commands.test, wt, to); fs.writeFileSync(fp, orig.join('\n'));
        gate.checks.mutants.applied++;
        if (!r.ok) gate.checks.mutants.killed++; else gate.checks.mutants.survivors.push({ file: c.file, line: c.line, mutation: c.m.name, was: c.src.trim().slice(0, 80) });
      }
    }
  });
  const hard = ['scope', 'frozen', 'skips', 'secrets', 'setup', 'build', 'lint', 'tests'];
  const failed = hard.filter(k => gate.checks[k] && gate.checks[k].ok === false && !gate.checks[k].skipped);
  if (gate.checks.contract.some(c => c.ok === false)) failed.push('contract');
  if (gate.checks.mutants.survivors.length) failed.push('mutants');
  gate.failed = failed; gate.pass = failed.length === 0; gate.ms = Date.now() - t0;
  writeJSON(path.join(unitDir(e, u), 'gate.json'), gate);
  const st = loadState(e); const us = unitState(st, u); us.stage = gate.pass ? 'gated' : 'gate_failed'; us.gate_pass = gate.pass; us.diff_sha256 = gate.diff_sha256; if (gate.promoted) us.class = gate.class_actual; saveState(e, st);
  metric(e, u, { stage: 'gate', event: 'gate', pass: gate.pass, failed, ms: gate.ms, class_actual: gate.class_actual, promoted: gate.promoted });
  out({ pass: gate.pass, failed, class_actual: gate.class_actual, promoted: gate.promoted, diff: gate.diff, mutants: gate.checks.mutants, tails: Object.fromEntries(failed.map(k => [k, gate.checks[k] && (gate.checks[k].tail || gate.checks[k].outside || gate.checks[k].changed || gate.checks[k].lines || gate.checks[k].survivors)])) });
  if (!gate.pass) process.exit(1);
};

// --- sandbox ---------------------------------------------------------------------------------
function copyTree(src, dst, strip) {
  const walk = (rel) => {
    for (const ent of fs.readdirSync(path.join(src, rel), { withFileTypes: true })) {
      const r = rel ? rel + '/' + ent.name : ent.name;
      if (r === '.git' || ent.name === '.git') continue;
      if (matchAny(r, strip) || matchAny(r + (ent.isDirectory() ? '/' : ''), strip)) continue;
      const s = path.join(src, r), d = path.join(dst, r);
      if (ent.isDirectory()) { fs.mkdirSync(d, { recursive: true }); walk(r); }
      else if (ent.isSymbolicLink()) { /* never copy symlinks into a sandbox */ }
      else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
    }
  };
  walk('');
}
function treeHash(dir) {
  const files = [];
  const walk = (rel) => { for (const ent of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) { const r = rel ? rel + '/' + ent.name : ent.name; if (r === '.git') continue; if (ent.isDirectory()) walk(r); else files.push(r + ':' + sha256(fs.readFileSync(path.join(dir, r)))); } };
  walk(''); files.sort(); return sha256(files.join('\n'));
}
commands.sandbox = ({ pos, opt }) => {
  const e = pos[0], u = pos[1]; if (!e || !u) fail('usage: sep sandbox <epic> <unit> [--lens cold|customer]');
  const lens = opt.lens || 'cold';
  const card = loadCard(e, u); if (!card) fail('no card');
  const pol = policy(); const zone = zoneById(card.zone);
  const head = git(['rev-parse', branchOf(e, u)]).out; if (!head) fail('unit branch not found');
  const strip = (pol.strip || []).concat(zone.secret_globs || []);
  // random, epic-free directory name: the path itself must not leak the epic
  const baseDir = path.join(os.tmpdir(), 'sep-blind', rid(6));
  const sb = path.join(baseDir, 'sandbox');
  fs.mkdirSync(sb, { recursive: true });
  const G = (args) => { const r = git(args, sb); if (r.code !== 0) throw new Error(`sandbox git ${args.join(' ')}: ${r.err}`); return r.out; };
  withWorktree(card.base_sha, (wt) => copyTree(wt, sb, strip));
  G(['init', '-q', '-b', 'main']); G(['config', 'user.name', 'reviewer']); G(['config', 'user.email', 'reviewer@sandbox']); G(['config', 'commit.gpgsign', 'false']);
  G(['add', '-A']); G(['commit', '-q', '--allow-empty', '-m', 'base']);
  // replace the tree with the head tree (keep .git)
  for (const ent of fs.readdirSync(sb)) if (ent !== '.git') fs.rmSync(path.join(sb, ent), { recursive: true, force: true });
  withWorktree(head, (wt) => copyTree(wt, sb, strip));
  G(['add', '-A']); G(['commit', '-q', '--allow-empty', '-m', 'change']);
  const diff = G(['diff', 'HEAD~1', 'HEAD']);
  // refuse to build a sandbox that carries secrets or narrative leaks; the gate should have caught them
  const leaks = [];
  if (SECRET_RES.some(r => r.test(diff))) leaks.push('secret-pattern');
  const st = loadState(e);
  for (const term of [e, `.separator`, st.canary].filter(Boolean)) if (diff.includes(term)) leaks.push(`narrative:${term}`);
  fs.writeFileSync(path.join(sb, '.git', 'info', 'exclude'), 'SEP-ACCEPTANCE.md\nSEP-COMMANDS.json\n');
  if (lens === 'customer' || lens === 'security') {
    const accP = path.join(epicDir(e), 'ACCEPTANCE.md');
    if (exists(accP)) fs.writeFileSync(path.join(sb, 'SEP-ACCEPTANCE.md'), fs.readFileSync(accP, 'utf8').replace(new RegExp(e, 'g'), 'this change'));
    fs.writeFileSync(path.join(sb, 'SEP-COMMANDS.json'), JSON.stringify({ setup: zone.commands.setup, build: zone.commands.build, test: zone.commands.test, run: zone.commands.run, checks: (card.checks || []).filter(c => c.kind !== 'observation').map(c => ({ id: c.id, cmd: c.cmd, expect: c.expect || 'exit 0' })) }, null, 2));
  }
  const manifest = { epic: e, unit: u, lens, sandbox: sb, base_sha: card.base_sha, head_sha: head, stripped: strip, tree_hash: treeHash(sb), canary_id: st.canary, leaks, built: nowISO() };
  writeJSON(path.join(unitDir(e, u), 'blind', `manifest-${lens}.json`), manifest);
  out({ sandbox: sb, lens, leaks, tree_hash: manifest.tree_hash, diff_lines: diff.split('\n').length });
  if (leaks.length) process.exit(1);
};

// --- blind (headless lens in the sandbox) ----------------------------------------------------
function parseAgentFile(p) {
  const txt = fs.readFileSync(p, 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(txt); if (!m) return { prompt: txt, tools: [] };
  const fm = {}; for (const line of m[1].split('\n')) { const k = /^([A-Za-z_]+):\s*(.*)$/.exec(line); if (k) fm[k[1]] = k[2].trim(); }
  const tools = fm.tools ? fm.tools.split(',').map(s => s.trim()).filter(Boolean) : [];
  return { prompt: m[2].trim(), tools, model: fm.model && fm.model !== 'inherit' ? fm.model : undefined, description: fm.description || '' };
}
const LENS_DEFAULTS = {
  cold: { tools: ['Read', 'Grep', 'Glob', 'Bash'], prompt: 'You are handed a code change with no explanation. You have never seen this project and know nothing about who wrote the change or why. Locate it with `git diff HEAD~1 HEAD` in the current directory. First write knowledge_statement: two sentences on everything you know about why this change exists (it should be nothing beyond the diff itself). Then inferred_intent: two sentences on what the change does and why it seems to exist. Then judge: SAFE (you would merge it into a codebase you own), UNSAFE (point to file:line and demonstrate a concrete defect by running something), or ILLEGIBLE (a stranger cannot tell what it does). Every UNSAFE finding needs a repro you actually ran, or a hazard class. Execute at least one command (tests, a script, a probe) before voting; an opinion without evidence has no weight.' },
  customer: { tools: ['Read', 'Grep', 'Glob', 'Bash'], prompt: 'You are inspecting a delivered product against its acceptance list, as a customer who knows nothing about how it was built. SEP-ACCEPTANCE.md lists the criteria; SEP-COMMANDS.json tells you how to build, test and run. The change is `git diff HEAD~1 HEAD`. First write knowledge_statement: everything you know about why this change exists. Then, for every criterion, actually exercise it (run the product, the tests, or a 10-line script against the public API) and report PASS / FAIL / UNVERIFIABLE with the exact command you ran. Verdict PASS only if every criterion passed; FAIL if any failed (with the command as repro); UNVERIFIABLE if you could not exercise a criterion.' },
  security: { tools: ['Read', 'Grep', 'Glob', 'Bash'], prompt: 'You are a security reviewer handed a change with no context (`git diff HEAD~1 HEAD`). First write knowledge_statement. Then look for injection, authz bypass, secrets, unsafe deserialization, path traversal, race conditions, data loss and irreversible side effects. Verdict SAFE / UNSAFE (with a demonstrated repro or a named hazard class) / ILLEGIBLE. Execute something before voting.' },
};
const BLIND_SCHEMA = {
  type: 'object',
  properties: {
    knowledge_statement: { type: 'string' },
    inferred_intent: { type: 'string' },
    verdict: { type: 'string', enum: ['SAFE', 'UNSAFE', 'ILLEGIBLE', 'PASS', 'FAIL', 'UNVERIFIABLE'] },
    per_acceptance: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, result: { type: 'string', enum: ['PASS', 'FAIL', 'UNVERIFIABLE'] }, how: { type: 'string' } }, required: ['id', 'result', 'how'] } },
    findings: { type: 'array', items: { type: 'object', properties: { claim: { type: 'string' }, file: { type: 'string' }, line: { type: 'integer' }, repro: { type: 'object', properties: { cmd: { type: 'string' }, expect: { type: 'string' }, got: { type: 'string' } }, required: ['cmd', 'expect', 'got'] }, hazard: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'important', 'minor'] } }, required: ['claim', 'severity'] } },
    evidence: { type: 'array', items: { type: 'object', properties: { cmd: { type: 'string' }, exit: { type: 'integer' }, excerpt: { type: 'string' } }, required: ['cmd', 'exit', 'excerpt'] } },
  },
  required: ['knowledge_statement', 'inferred_intent', 'verdict', 'findings', 'evidence'],
};
function extractJSON(text) {
  const fence = /```(?:json)?\s*([\s\S]*?)```/g; let m;
  while ((m = fence.exec(text))) { try { const v = JSON.parse(m[1]); if (v && typeof v === 'object') return v; } catch (_) { } }
  const i = text.indexOf('{'); if (i < 0) return null;
  for (let j = text.lastIndexOf('}'); j > i; j = text.lastIndexOf('}', j - 1)) { try { const v = JSON.parse(text.slice(i, j + 1)); if (v && typeof v === 'object') return v; } catch (_) { } }
  return null;
}
function normalizeLens(p) {
  const v = String(p.verdict || '').toUpperCase(); p.verdict = ['SAFE', 'UNSAFE', 'ILLEGIBLE', 'PASS', 'FAIL', 'UNVERIFIABLE'].includes(v) ? v : 'INVALID';
  const arr = (x) => Array.isArray(x) ? x : (x && typeof x === 'object' ? Object.values(x) : []);
  p.findings = arr(p.findings).map(f => typeof f === 'string' ? { claim: f, severity: 'minor' } : Object.assign({ severity: 'minor' }, f, { claim: f.claim || f.description || f.title || f.note || f.summary || JSON.stringify(f).slice(0, 120), severity: ['blocker', 'important', 'minor'].includes(f.severity) ? f.severity : (f.severity === 'critical' || f.severity === 'high' ? 'blocker' : 'minor') }));
  p.evidence = arr(p.evidence).map(x => typeof x === 'string' ? { cmd: x, exit: 0, excerpt: '' } : x);
  p.per_acceptance = arr(p.per_acceptance).filter(a => a && typeof a === 'object').map(a => ({ id: a.id, result: String(a.result || a.verdict || '').toUpperCase(), how: a.how || a.command_run || a.command || '' })).filter(a => ['PASS', 'FAIL', 'UNVERIFIABLE'].includes(a.result));
  if (typeof p.knowledge_statement !== 'string') p.knowledge_statement = '';
  if (typeof p.inferred_intent !== 'string') p.inferred_intent = '';
  return p;
}
commands.blind = ({ pos, opt }) => {
  const e = pos[0], u = pos[1]; if (!e || !u) fail('usage: sep blind <epic> <unit> --lens cold|customer|security');
  const lens = opt.lens || 'cold';
  const pol = policy();
  let man = readJSON(path.join(unitDir(e, u), 'blind', `manifest-${lens}.json`), null);
  if (!man || !exists(man.sandbox) || opt.rebuild) {
    const r = cp.spawnSync(process.execPath, [SELF, 'sandbox', e, u, '--lens', lens], { encoding: 'utf8', env: Object.assign({}, process.env, { SEP_ROOT: ROOT }) });
    if (r.status !== 0) fail(`sandbox failed: ${r.stdout}${r.stderr}`);
    man = readJSON(path.join(unitDir(e, u), 'blind', `manifest-${lens}.json`));
  }
  const agentFile = path.join(ROOT, '.claude', 'agents', `sep-outsider-${lens}.md`);
  const def = exists(agentFile) ? parseAgentFile(agentFile) : {};
  const base = LENS_DEFAULTS[lens] || LENS_DEFAULTS.cold;
  const agentName = `sep-outsider-${lens}`;
  const tools = (def.tools && def.tools.length ? def.tools : base.tools).filter(t => ['Read', 'Grep', 'Glob', 'Bash'].includes(t));
  const cfgDir = path.join(path.dirname(man.sandbox), 'cfg'); fs.mkdirSync(cfgDir, { recursive: true });
  const agents = {}; agents[agentName] = { description: 'context-free reviewer', prompt: def.prompt || base.prompt, tools };
  if (opt.model || pol.blind.model || def.model) agents[agentName].model = opt.model || pol.blind.model || def.model;
  writeJSON(path.join(cfgDir, 'agents.json'), agents);
  writeJSON(path.join(cfgDir, 'settings.json'), { hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: `"${process.execPath}" "${SELF}" hook guard-blind`, timeout: 15 }] }] } });
  writeJSON(path.join(cfgDir, 'schema.json'), BLIND_SCHEMA);
  const prompt = `Review the change in the current directory (git diff HEAD~1 HEAD). Return the JSON object described by the schema. Fields: knowledge_statement, inferred_intent, verdict, findings (each with severity and, for blockers, a repro you ran or a hazard class), evidence (commands you actually ran), per_acceptance (customer lens only).`;
  const args = ['-p', prompt, '--restricted', '--tools', tools.join(','), '--allowedTools', tools.join(','), '--agents', path.join(cfgDir, 'agents.json'), '--agent', agentName, '--settings', path.join(cfgDir, 'settings.json'), '--output-format', 'json', '--json-schema', JSON.stringify(BLIND_SCHEMA), '--max-turns', String(pol.blind.max_turns || 30)];
  if (agents[agentName].model) args.push('--model', agents[agentName].model);
  const env = Object.assign({}, process.env); delete env.CLAUDE_PROJECT_DIR; delete env.SEP_ROOT; env.SEP_BLIND_SANDBOX = man.sandbox;
  const t0 = Date.now();
  const r = cp.spawnSync(pol.blind.launcher || 'claude', args, { cwd: man.sandbox, encoding: 'utf8', env, timeout: (pol.blind.timeout_seconds || 900) * 1000, maxBuffer: 64 * 1024 * 1024 });
  let res = null; try { res = JSON.parse(r.stdout); } catch (_) { }
  const rec = { lens, unit: u, epic: e, launcher: pol.blind.launcher || 'claude', ms: Date.now() - t0, exit: r.status, sandbox_tree_hash: man.tree_hash };
  let payload = res && (res.structured_output || null);
  if (!payload && res && typeof res.result === 'string') payload = extractJSON(res.result);
  if (payload) payload = normalizeLens(payload);
  rec.raw_result = res && typeof res.result === 'string' ? res.result.slice(0, 4000) : null;
  if (!payload) { rec.verdict = 'INVALID'; rec.error = (res && (res.result || res.subtype)) || r.stderr.slice(-800) || 'no output'; }
  else Object.assign(rec, payload);
  rec.denials = ((res && res.permission_denials) || []).map(d => d.tool_input && (d.tool_input.command || d.tool_input.file_path)).filter(Boolean);
  // leak check: canary, forbidden reads (denials outside sandbox), narrative terms in the verdict
  const text = JSON.stringify(payload || {});
  rec.leak_check = { canary_hit: !!(man.canary_id && text.includes(man.canary_id)), forbidden_reads: rec.denials, narrative_terms: [e, '.separator', 'card.json', 'dag.json', 'SEP-CANARY'].filter(t => text.includes(t)), clean: true };
  rec.leak_check.clean = !rec.leak_check.canary_hit && rec.leak_check.narrative_terms.length === 0;
  if (rec.verdict !== 'INVALID' && (!rec.evidence || !rec.evidence.length)) rec.verdict_weight = 0; else rec.verdict_weight = 1;
  writeJSON(path.join(unitDir(e, u), 'blind', `blind-${lens}.json`), rec);
  const st = loadState(e); const us = unitState(st, u); us.stage = 'blinded'; us.calls = (us.calls || 0) + 1; saveState(e, st);
  metric(e, u, { stage: 'blind', event: 'lens', lens, verdict: rec.verdict, weight: rec.verdict_weight, leak_clean: rec.leak_check.clean, ms: rec.ms });
  out({ lens, verdict: rec.verdict, weight: rec.verdict_weight, findings: (rec.findings || []).length, evidence: (rec.evidence || []).length, leak_check: rec.leak_check, inferred_intent: rec.inferred_intent || null, error: rec.error || null });
};

// --- hooks -----------------------------------------------------------------------------------
function readStdinJSON() { try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch (_) { return {}; } }
function deny(reason) { process.stderr.write(`[separator] DENIED: ${reason}\n`); process.exit(2); }
const SCRIPT_ONLY = new Set(['gate.json', 'decision.json', 'state.json', 'schedule.json', 'evidence.json', 'card.json', 'manifest-cold.json', 'manifest-customer.json', 'manifest-security.json', 'blind-cold.json', 'blind-customer.json', 'blind-security.json', 'leak-check.json', 'metrics.jsonl']);
commands.hook = ({ pos }) => {
  const guard = pos[0]; const j = readStdinJSON();
  const cwd = j.cwd || process.cwd(); const agentType = j.agent_type || '';
  const isAgent = !!agentType && agentType !== '-';
  if (guard === 'guard-write') {
    const fp = j.tool_input && (j.tool_input.file_path || j.tool_input.notebook_path); if (!fp) process.exit(0);
    const ctx = unitContext(cwd);
    if (ctx) {
      const rel = relToRoot(fp, cwd);
      if (rel.startsWith('..')) deny(`unit ${ctx.unit}: writes outside the worktree are not allowed (${rel})`);
      const card = loadCard(ctx.epic, ctx.unit) || {};
      const zone = zoneById(card.zone); const pol = policy();
      const frozen = (pol.frozen_globs || []).concat(zone.test_globs || []);
      if (rel.startsWith('.separator/')) { if (rel === `.separator/epics/${ctx.epic}/units/${ctx.unit}/notes.md` || rel.startsWith(`.separator/epics/${ctx.epic}/units/${ctx.unit}/tests/`)) process.exit(0); deny('run artifacts are owned by the funnel scripts'); }
      if (ctx.role === 'prober') { if (!matchAny(rel, card.test_writes || [])) deny(`prober may only write acceptance tests (${(card.test_writes || []).join(', ') || 'none declared'})`); process.exit(0); }
      const RESERVED = ['**/acc_*', '**/regress_*'];
      const isNew = !exists(path.join(cwd, rel)) && git(['cat-file', '-e', `${card.base_sha || 'HEAD'}:${rel}`], cwd).code !== 0;
      if (matchAny(rel, RESERVED)) deny(`${rel}: acceptance and regression tests are frozen (written by the prober / the ratchet only)`);
      if (matchAny(rel, frozen) && !isNew && !matchAny(rel, card.test_writes || [])) deny(`frozen test file ${rel}: tests verify, they do not define; ADD a new test file instead, or report a wrong test in notes.md`);
      if (matchAny(rel, zone.test_globs || []) && isNew) process.exit(0); // new test files in the zone are always welcome
      if (!matchAny(rel, (card.writes || []).concat(card.allow_test_edits ? (card.test_writes || []) : []))) deny(`${rel} is outside the unit's write-set [${(card.writes || []).join(', ')}]; write SCOPE-REQUEST.md in your notes instead of widening`);
      process.exit(0);
    }
    const rel = relToRoot(fp, ROOT);
    if (rel.startsWith('.separator/epics/')) {
      const bn = path.basename(rel);
      if (SCRIPT_ONLY.has(bn)) deny(`${bn} is written only by sep (scripts hold counters and verdicts, agents do not)`);
      if (bn === 'request.md' && exists(path.join(ROOT, rel))) deny('request.md is immutable once written (the verbatim request is the anchor for every later stage)');
    }
    if (rel === '.separator/metrics.jsonl' || rel === '.separator/escapes.jsonl') deny('ledgers are appended by sep only');
    process.exit(0);
  }
  if (guard === 'guard-bash') {
    const cmd = (j.tool_input && j.tool_input.command) || '';
    const ctx = unitContext(cwd);
    if (!isAgent && !ctx) process.exit(0); // the human's own session is never restricted
    const rules = [
      [/\bgit\s+push\b/, 'agents never push; merges happen through `sep merge` and the human promotes integration → main'],
      [/\bgit\s+merge\b/, 'agents never merge; `sep merge` does after a decision'],
      [/\bgit\s+(checkout|switch)\s+(-q\s+)?(main|master|integration)\b/, 'never switch to a protected branch inside a unit'],
      [/\bgit\s+(branch\s+-D|worktree\s+(remove|prune)|reset\s+--hard|clean\s+-[a-z]*f)/, 'destructive git operations are reserved to sep'],
      [/--no-verify\b/, 'hooks are part of the harness'],
      [/\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+(\/|~|\$HOME|\.\.|\*)/, 'refusing recursive delete outside the worktree'],
      [/\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i, 'irreversible database statements need a human ruling'],
      [/>\s*\S*(gate|decision|state|schedule|evidence|card)\.json\b/, 'script-owned artifact'],
    ];
    for (const [re, why] of rules) if (re.test(cmd)) deny(`${why} (${cmd.slice(0, 80)})`);
    process.exit(0);
  }
  if (guard === 'guard-blind') {
    const cmd = (j.tool_input && j.tool_input.command) || '';
    const sb = process.env.SEP_BLIND_SANDBOX || cwd;
    const bad = [
      [/(^|[\s'"=:])\.\.(\/|\\|$|[\s'"])/, 'parent paths'], [/\/home\/|\/root\/|\/Users\/|[A-Za-z]:\\/, 'absolute paths outside the sandbox'], [/(^|\s)~(\/|\s|$)|\$HOME|\$CLAUDE|\$SEP/, 'home or environment paths'],
      [/\.separator|\.claude|CLAUDE\.md|AGENTS\.md|\.cursor/, 'funnel or assistant configuration'], [/\bgit\s+(log|reflog|show|branch|show-ref|tag|remote|notes|describe|rev-list|for-each-ref|stash)\b/, 'git history (only `git diff HEAD~1 HEAD` is allowed)'],
      [/\.git\//, 'git internals'], [/\bprintenv\b|(^|[\s;&|(])env(\s*$|\s*\||\s+-)/, 'environment dumps'], [/\b(curl|wget|ssh|scp|nc)\b/, 'network'],
    ];
    for (const [re, why] of bad) if (re.test(cmd)) deny(`blind reviewer may not access ${why}`);
    const tmpRefs = cmd.match(/\/(?:tmp|var\/folders|private\/tmp)\/[^\s'"|;&)]*/g) || [];
    for (const t of tmpRefs) { if (t.startsWith(sb)) continue; if (/sep-blind\//.test(t)) deny('blind reviewer may not touch other sandboxes'); if (/\/claude-[^/]*\//.test(t) && !/sep-blind/.test(t)) deny('blind reviewer may not touch assistant scratch directories'); }
    process.exit(0);
  }
  process.exit(0);
};

// --- ratchet: repros become permanent tests, sigs are remembered ----------------------------
commands.ratchet = ({ pos }) => {
  const e = pos[0], u = pos[1], file = pos[2]; if (!e || !u || !file) fail('usage: sep ratchet <epic> <unit> <findings.json>');
  const findings = readJSON(path.resolve(file)); const st = loadState(e); const us = unitState(st, u);
  const cards = []; let escalate = false;
  for (const f of Array.isArray(findings) ? findings : (findings.findings || [])) {
    if (!f.repro && !f.hazard) continue; // notes never move anything
    const sig = f.sig || sha256((f.repro ? f.repro.cmd + '|' + f.repro.expect : f.file + ':' + f.line + ':' + f.claim)).slice(0, 8);
    if (us.sigs_seen.includes(sig)) { escalate = true; cards.push({ sig, repeat: true, claim: f.claim }); continue; }
    us.sigs_seen.push(sig);
    const dc = { sig, claim: f.claim, file: f.file, line: f.line, repro: f.repro || null, hazard: f.hazard || null, origin: f.origin || 'code', severity: f.severity || 'important', recorded: nowISO() };
    writeJSON(path.join(unitDir(e, u), 'defects', `${sig}.json`), dc);
    if (f.repro && f.repro.cmd) { const tp = path.join(unitDir(e, u), 'tests', `regress_${sig}.sh`); fs.writeFileSync(tp, `#!/bin/sh\n# regression from finding ${sig}: ${(f.claim || '').replace(/\n/g, ' ')}\n# expect: ${f.repro.expect}\n${f.repro.cmd}\n`); dc.regress = tp; }
    cards.push(dc);
  }
  us.stage = 'inspected'; saveState(e, st);
  metric(e, u, { stage: 'ratchet', event: 'ratchet', new_sigs: cards.filter(c => !c.repeat).length, repeats: cards.filter(c => c.repeat).length });
  out({ cards, escalate, sigs_seen: us.sigs_seen });
};

// --- decide: the decision table, evaluated top-down --------------------------------------------
commands.decide = ({ pos }) => {
  const e = pos[0], u = pos[1]; if (!e || !u) fail('usage: sep decide <epic> <unit>');
  const pol = policy(); const st = loadState(e); const us = unitState(st, u); const card = loadCard(e, u) || {};
  const cls = us.class || card.class || st.class || 'T1'; const lane = pol.lanes[cls];
  const gate = readJSON(path.join(unitDir(e, u), 'gate.json'), null);
  const insp = fs.existsSync(path.join(unitDir(e, u))) ? fs.readdirSync(unitDir(e, u)).filter(f => /^inspect-.*\.json$/.test(f)).map(f => readJSON(path.join(unitDir(e, u), f))) : [];
  const blinds = exists(path.join(unitDir(e, u), 'blind')) ? fs.readdirSync(path.join(unitDir(e, u), 'blind')).filter(f => /^blind-.*\.json$/.test(f)).map(f => readJSON(path.join(unitDir(e, u), 'blind', f))) : [];
  const inputs = { G: gate ? (gate.pass ? 'pass' : 'fail') : 'missing', S: gate ? (gate.checks.scope.ok ? 'yes' : 'no') : 'unknown' };
  const sevRank = { blocker: 3, important: 2, minor: 1 };
  const inspFindings = insp.flatMap(i => i.findings || []);
  const counted = (f) => (f.repro && f.repro.cmd) || (f.hazard && pol.hazard_classes.includes(f.hazard));
  inputs.I = insp.some(i => i.verdict === 'kill') ? 'kill' : insp.some(i => i.verdict === 'replan') ? 'replan' : inspFindings.some(f => counted(f) && sevRank[f.severity] >= 2) ? 'fix' : 'pass';
  const cust = blinds.find(b => b.lens === 'customer'), cold = blinds.find(b => b.lens === 'cold'), sec = blinds.find(b => b.lens === 'security');
  inputs.Bc = cust ? (cust.verdict_weight === 0 ? 'INVALID' : cust.verdict) : 'skipped';
  inputs.Bk = cold ? (cold.verdict_weight === 0 ? 'INVALID' : cold.verdict) : 'skipped';
  inputs.Bs = sec ? sec.verdict : 'skipped';
  inputs.L = blinds.every(b => !b.leak_check || b.leak_check.clean) ? 'clean' : 'dirty';
  inputs.E = blinds.every(b => b.verdict === 'INVALID' || (b.evidence && b.evidence.length)) ? 'ok' : 'empty';
  inputs.M = us.intent_match || st.intent_match || 'UNKNOWN'; // set by the driver after the cold lens: MATCH | MISMATCH | UNKNOWN
  const blindBlocks = blinds.flatMap(b => (b.findings || []).filter(f => f.severity === 'blocker' && f.repro && f.repro.cmd));
  const holds = blinds.concat(insp).flatMap(x => (x.findings || []).filter(f => !f.repro && f.hazard && pol.hazard_classes.includes(f.hazard) && !f.refuted));
  inputs.H = holds.length; inputs.K = { execute: us.sendbacks.execute, contract: us.sendbacks.contract, decompose: us.sendbacks.decompose, intake: us.sendbacks.intake, exec_retries: us.exec_retries, integration_rounds: us.integration_rounds, calls: us.calls, blind_reruns: us.blind_reruns };
  inputs.R = us.integration || 'pending';
  const observationOnly = (card.checks || []).length > 0 && (card.checks || []).every(c => c.kind === 'observation');
  const caps = { execute: lane.sendbacks_execute, contract: pol.counters.sendbacks_contract[cls], decompose: pol.counters.sendbacks_decompose[cls], intake: pol.counters.sendbacks_intake, calls: lane.calls };
  let row, action, target, why;
  const R = (n, a, t, w) => { row = n; action = a; target = t || null; why = w; };
  const exhausted = Object.entries(caps).filter(([k, cap]) => (k === 'calls' ? us.calls : us.sendbacks[k]) > cap).map(([k]) => k);
  if (exhausted.length || us.no_progress) R(1, 'ESCALATE', 'H3', `counter exhausted: ${exhausted.join(',') || 'no progress'}`);
  else if (inputs.G !== 'pass') R(2, 'SENDBACK', us.exec_retries < pol.counters.exec_retries ? 'S5' : 'S2', `gate ${inputs.G}: ${(gate && gate.failed || []).join(',')}`);
  else if (inputs.S === 'no') R(3, 'SENDBACK', 'S2', 'diff outside write-set');
  else if (gate.promoted && !us.promotion_handled) R(4, 'PROMOTE', gate.class_actual, `actual class ${gate.class_actual} > predicted ${gate.class_predicted}`);
  else if (inputs.L === 'dirty' || inputs.E === 'empty' || blinds.some(b => b.verdict === 'INVALID')) R(5, us.blind_reruns < 1 ? 'RERUN-BLIND' : 'ESCALATE', us.blind_reruns < 1 ? 'S7' : 'H3', `blind panel ${inputs.L === 'dirty' ? 'leaked' : 'invalid or without evidence'}`);
  else if (inputs.I === 'kill') R(6, 'ESCALATE', 'H3', 'inspector: kill');
  else if (inputs.I === 'replan') R(7, 'SENDBACK', 'S2', 'inspector: replan');
  else if (inputs.I === 'fix' && inspFindings.some(f => counted(f) && f.origin === 'contract')) R(8, 'SENDBACK', 'S4', 'contract wrong');
  else if (inputs.I === 'fix' && inspFindings.some(f => counted(f) && f.origin === 'request')) R(9, 'SENDBACK', 'S0', 'request ambiguous');
  else if (inputs.I === 'fix' || blindBlocks.length) R(10, 'SENDBACK', 'S5', `${inspFindings.filter(counted).length + blindBlocks.length} counted findings with repro`);
  else if (inputs.Bc === 'FAIL') R((cust.per_acceptance || []).some(a => a.result === 'FAIL' && (card.checks || []).some(c => c.maps_to === a.id)) ? 11 : 12, 'SENDBACK', (cust.per_acceptance || []).some(a => a.result === 'FAIL' && (card.checks || []).some(c => c.maps_to === a.id)) ? 'S5' : 'S4', 'customer lens failed an acceptance criterion');
  else if (inputs.Bc === 'UNVERIFIABLE') R(13, observationOnly ? 'HOLD' : 'SENDBACK', observationOnly ? 'H2' : 'S0', 'acceptance not observable');
  else if (inputs.Bk === 'UNSAFE' && blindBlocks.length === 0 && holds.length === 0) R(14, 'SENDBACK', 'S5', 'cold lens UNSAFE without repro: treated as a fix request once');
  else if (inputs.H > 0) R(15, 'HOLD', 'H2', `${inputs.H} hazard hold(s): ${holds.map(h => h.hazard).join(',')}`);
  else if ((inputs.Bk === 'ILLEGIBLE' || inputs.M === 'MISMATCH') && !us.rationale_added) R(16, 'SENDBACK', 'S5', 'add rationale (doc comment / ADR / test name); a stranger could not read the change');
  else if ((inputs.Bk === 'ILLEGIBLE' || inputs.M === 'MISMATCH') && us.rationale_added) R(16, 'ESCALATE', 'H3', 'still illegible after rationale');
  else if (inputs.R === 'conflict' || inputs.R === 'regression') R(18, us.integration_rounds < pol.counters.integration_rounds ? 'SENDBACK' : 'ESCALATE', us.integration_rounds < pol.counters.integration_rounds ? 'S5' : 'H3', `integration ${inputs.R}`);
  else if (observationOnly) R(22, 'HOLD', 'H2', 'observation-only unit never auto-merges');
  else if (cls === 'T2' || cls === 'T3') R(19, 'MERGE-CARD', 'H2', 'high-risk class waits for the human');
  else R(inspFindings.length || blinds.some(b => (b.findings || []).length) ? 19 : 20, 'MERGE', pol.integration_branch, 'all separators passed');
  const decision = { unit: u, epic: e, class: cls, row, action, target, why, inputs, diff_sha256: gate ? gate.diff_sha256 : null, at: nowISO(), defer: inspFindings.concat(blinds.flatMap(b => b.findings || [])).filter(f => f.severity === 'minor').map(f => f.claim).slice(0, 10) };
  writeJSON(path.join(unitDir(e, u), 'decision.json'), decision);
  // counters move here, never in prompts
  if (action === 'SENDBACK') { if (target === 'S5' && inputs.G !== 'pass') us.exec_retries++; else if (target === 'S5') us.sendbacks.execute++; else if (target === 'S4') us.sendbacks.contract++; else if (target === 'S2') us.sendbacks.decompose++; else if (target === 'S0') us.sendbacks.intake++; if (row === 16) us.rationale_added = true; if (row === 18) us.integration_rounds++; }
  if (action === 'RERUN-BLIND') us.blind_reruns++;
  if (action === 'PROMOTE') { us.promotion_handled = true; us.class = target; }
  if (action === 'ESCALATE') { st.human_escalations++; us.parked = why; }
  const NEXT = { MERGE: 'merge', 'MERGE-CARD': 'card', HOLD: 'card', ESCALATE: 'card', PROMOTE: 'inspect', 'RERUN-BLIND': 'blind', SENDBACK: { S5: 'execute', S4: 'spike', S2: 'replan', S0: 'ask' }[target] || 'replan' };
  us.stage = NEXT[action] || action.toLowerCase(); us.last_decision = { row, action, target, why }; if (action === 'SENDBACK' && target === 'S5') us.round = (us.round || 0) + 1; saveState(e, st);
  metric(e, u, { stage: 'verdict', event: 'decide', row, action, target, class: cls });
  out({ row, action, target, why, inputs: Object.assign({}, inputs, { K: undefined }), counters: us.sendbacks, exec_retries: us.exec_retries });
};

// --- merge -----------------------------------------------------------------------------------
commands.merge = ({ pos, opt }) => {
  const e = pos[0], u = pos[1]; if (!e || !u) fail('usage: sep merge <epic> <unit>');
  const pol = policy(); const dec = readJSON(path.join(unitDir(e, u), 'decision.json'), null); if (!dec) fail('no decision');
  const card = loadCard(e, u); const br = branchOf(e, u); const head = git(['rev-parse', br]).out;
  const approved = exists(path.join(unitDir(e, u), 'MERGE_APPROVED'));
  if (!(dec.action === 'MERGE' || (dec.action === 'MERGE-CARD' && approved) || (dec.action === 'HOLD' && approved))) fail(`decision is ${dec.action}${dec.action !== 'MERGE' ? ' and MERGE_APPROVED is missing' : ''}`);
  const nowHash = sha256(git(['diff', `${card.base_sha}..${head}`]).out);
  if (nowHash !== dec.diff_sha256) fail('the code changed after the verdict (diff hash mismatch): re-run the gate and the lenses');
  const ib = pol.integration_branch || 'integration';
  if (git(['rev-parse', '--verify', '--quiet', ib]).code !== 0) { const r = git(['branch', ib, card.base_sha]); if (r.code !== 0) fail(`cannot create ${ib}: ${r.err}`); }
  return withWorktree(ib, (wt) => {
    git(['checkout', '-q', ib], wt);
    const dry = git(['merge-tree', '--write-tree', ib, br], wt);
    if (dry.code !== 0 && !opt.force) { const st = loadState(e); const us = unitState(st, u); us.integration = 'conflict'; saveState(e, st); out({ merged: false, conflict: true, detail: dry.out.slice(0, 2000) }); process.exit(1); }
    const m = git(['-c', 'user.name=separator', '-c', 'user.email=separator@local', 'merge', '--no-ff', '-q', '-m', `merge ${u}\n\nSeparator-Epic: ${e}\nSeparator-Unit: ${u}\nSeparator-Diff: ${dec.diff_sha256}\nSeparator-Row: ${dec.row}`, br], wt);
    if (m.code !== 0) fail(`merge failed: ${m.err}`);
    const sha = git(['rev-parse', 'HEAD'], wt).out;
    const st = loadState(e); const us = unitState(st, u); us.merged = true; us.integration = 'green'; us.stage = 'merged'; us.merge_sha = sha; saveState(e, st);
    metric(e, u, { stage: 'merge', event: 'merged', sha, row: dec.row });
    out({ merged: true, integration: ib, sha });
  });
};

// --- card (merge card / stuck card) ----------------------------------------------------------
commands.card = ({ pos }) => {
  const e = pos[0], u = pos[1]; if (!e || !u) fail('usage: sep card <epic> <unit>');
  const st = loadState(e); const us = unitState(st, u); const card = loadCard(e, u) || {}; const gate = readJSON(path.join(unitDir(e, u), 'gate.json'), {}); const dec = readJSON(path.join(unitDir(e, u), 'decision.json'), {});
  const blinds = exists(path.join(unitDir(e, u), 'blind')) ? fs.readdirSync(path.join(unitDir(e, u), 'blind')).filter(f => /^blind-.*\.json$/.test(f)).map(f => readJSON(path.join(unitDir(e, u), 'blind', f))) : [];
  const acc = exists(path.join(epicDir(e), 'ACCEPTANCE.md')) ? fs.readFileSync(path.join(epicDir(e), 'ACCEPTANCE.md'), 'utf8').trim() : '(no ACCEPTANCE.md)';
  const lines = [];
  lines.push(`${dec.action === 'ESCALATE' ? 'STUCK CARD' : 'MERGE CARD'}  epic ${e} / unit ${u}   class ${us.class || card.class}   decision: ${dec.action || '-'} (row ${dec.row || '-'}) ${dec.why || ''}`);
  lines.push(`Goal: ${card.title || card.goal || '-'}`);
  lines.push(`Acceptance:\n${acc}`);
  lines.push(`Gate: ${gate.pass ? 'PASS' : 'FAIL ' + (gate.failed || []).join(',')}  diff ${gate.diff ? `${gate.diff.files} files +${gate.diff.insertions}/-${gate.diff.deletions}` : '-'}  mutants ${gate.checks && gate.checks.mutants ? `${gate.checks.mutants.killed}/${gate.checks.mutants.applied}` : '-'}  class actual ${gate.class_actual || '-'}`);
  for (const b of blinds) lines.push(`Blind ${b.lens}: ${b.verdict}${b.inferred_intent ? ` — "${b.inferred_intent}"` : ''}${(b.findings || []).length ? ` findings: ${b.findings.map(f => f.severity + ': ' + f.claim).join('; ')}` : ''}`);
  lines.push(`Rounds: execute ${us.sendbacks.execute}, contract ${us.sendbacks.contract}, decompose ${us.sendbacks.decompose}; exec_retries ${us.exec_retries}; sigs ${us.sigs_seen.join(',') || '-'}`);
  if (dec.defer && dec.defer.filter(Boolean).length) lines.push(`Skim → deferred: ${dec.defer.filter(Boolean).join('; ')}`);
  lines.push(`Diff sha256 ${dec.diff_sha256 || '-'} (any code change after this invalidates the card)`);
  lines.push(dec.action === 'ESCALATE' ? `Options: [1] send back with a ruling  [2] split the unit  [3] kill   → sep answer ${e} ${u} <option>` : `[approve]  touch ${path.relative(ROOT, path.join(unitDir(e, u), 'MERGE_APPROVED'))}   [send back]  write a ruling in .separator/rulings.md and run sep decide again   [kill]`);
  const md = lines.join('\n') + '\n';
  us.stage = dec.action === 'ESCALATE' ? 'parked' : 'awaiting_human'; if (dec.action === 'ESCALATE') us.parked = dec.why; saveState(e, st);
  fs.mkdirSync(path.join(epicDir(e), 'merge-cards'), { recursive: true });
  fs.writeFileSync(path.join(epicDir(e), 'merge-cards', `${u}${dec.action === 'ESCALATE' ? '-stuck' : ''}.md`), md);
  process.stdout.write(md);
};

// --- validate (minimal JSON-schema subset: type, required, properties, enum, items, minItems) -
function validate(v, s, p = '$') {
  const errs = [];
  if (!s) return errs;
  const t = s.type;
  const typeOf = (x) => Array.isArray(x) ? 'array' : x === null ? 'null' : typeof x === 'number' ? (Number.isInteger(x) ? 'integer' : 'number') : typeof x;
  if (t) { const ok = [].concat(t).some(tt => tt === typeOf(v) || (tt === 'number' && typeOf(v) === 'integer')); if (!ok) errs.push(`${p}: expected ${t}, got ${typeOf(v)}`); }
  if (s.enum && !s.enum.includes(v)) errs.push(`${p}: not in enum`);
  if (s.properties && v && typeof v === 'object') { for (const k of s.required || []) if (!(k in v)) errs.push(`${p}.${k}: required`); for (const [k, ss] of Object.entries(s.properties)) if (k in v) errs.push(...validate(v[k], ss, `${p}.${k}`)); }
  if (s.items && Array.isArray(v)) { if (s.minItems && v.length < s.minItems) errs.push(`${p}: minItems ${s.minItems}`); v.forEach((x, i) => errs.push(...validate(x, s.items, `${p}[${i}]`))); }
  return errs;
}
commands.validate = ({ pos, opt }) => {
  const file = pos[0]; if (!file || !opt.schema) fail('usage: sep validate <file> --schema <name>');
  const s = readJSON(path.join(SEP, 'schemas', `${opt.schema}.json`)); const v = readJSON(path.resolve(file));
  const errs = validate(v, s); out({ ok: !errs.length, errors: errs }); if (errs.length) process.exit(1);
};

// --- selftest --------------------------------------------------------------------------------
commands.selftest = () => {
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });
  // 1. hooks: guard-write denies a frozen test edit in a fake unit context
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sep-selftest-'));
  try {
    const runHook = (guard, input) => cp.spawnSync(process.execPath, [SELF, 'hook', guard], { input: JSON.stringify(input), encoding: 'utf8', env: Object.assign({}, process.env, { SEP_ROOT: ROOT }) });
    // fake epic/unit
    const e = `selftest-${rid(2)}`, u = 'U1';
    fs.mkdirSync(unitDir(e, u), { recursive: true });
    writeJSON(path.join(unitDir(e, u), 'card.json'), { id: u, zone: 'default', writes: ['src/**'], test_writes: ['tests/acc_U1.test.js'], base_sha: 'x', class: 'T1' });
    fs.mkdirSync(path.join(tmp, 'wt'), { recursive: true }); writeJSON(path.join(tmp, 'wt', '.sep-role'), { role: 'executor', epic: e, unit: u });
    const r1 = runHook('guard-write', { cwd: path.join(tmp, 'wt'), agent_type: 'sep-executor', tool_name: 'Edit', tool_input: { file_path: path.join(tmp, 'wt', 'tests', 'acc_U1.test.js') } });
    check('guard-write denies frozen acceptance test', r1.status === 2, r1.stderr.trim());
    const r2 = runHook('guard-write', { cwd: path.join(tmp, 'wt'), agent_type: 'sep-executor', tool_name: 'Edit', tool_input: { file_path: path.join(tmp, 'wt', 'docs', 'x.md') } });
    check('guard-write denies write outside write-set', r2.status === 2, r2.stderr.trim());
    const r3 = runHook('guard-write', { cwd: path.join(tmp, 'wt'), agent_type: 'sep-executor', tool_name: 'Edit', tool_input: { file_path: path.join(tmp, 'wt', 'src', 'a.js') } });
    check('guard-write allows write inside write-set', r3.status === 0, r3.stderr.trim());
    const r4 = runHook('guard-write', { cwd: ROOT, agent_type: 'sep-planner', tool_name: 'Write', tool_input: { file_path: path.join(unitDir(e, u), 'gate.json') } });
    check('guard-write denies agent writing gate.json', r4.status === 2, r4.stderr.trim());
    const r5 = runHook('guard-bash', { cwd: ROOT, agent_type: 'sep-executor', tool_name: 'Bash', tool_input: { command: 'git push origin main' } });
    check('guard-bash denies git push for agents', r5.status === 2, r5.stderr.trim());
    const r6 = runHook('guard-bash', { cwd: ROOT, tool_name: 'Bash', tool_input: { command: 'git push origin main' } });
    check('guard-bash never restricts the human session', r6.status === 0, r6.stderr.trim());
    const r7 = runHook('guard-blind', { cwd: tmp, tool_name: 'Bash', tool_input: { command: 'cat ../../.separator/epics/x/dag.json' } });
    check('guard-blind denies parent paths', r7.status === 2, r7.stderr.trim());
    const r8 = runHook('guard-blind', { cwd: tmp, tool_name: 'Bash', tool_input: { command: 'git log --oneline' } });
    check('guard-blind denies git history', r8.status === 2, r8.stderr.trim());
    const r9 = runHook('guard-blind', { cwd: tmp, tool_name: 'Bash', tool_input: { command: 'git diff HEAD~1 HEAD --stat && npm test' } });
    check('guard-blind allows diff and tests', r9.status === 0, r9.stderr.trim());
    // 2. decision table trips ESCALATE on exhausted counter
    const st = loadState(e); const us = unitState(st, u); us.sendbacks.execute = 99; saveState(e, st);
    writeJSON(path.join(unitDir(e, u), 'gate.json'), { pass: true, checks: { scope: { ok: true } }, diff_sha256: 'd', class_actual: 'T1', class_predicted: 'T1', promoted: false });
    const d = cp.spawnSync(process.execPath, [SELF, 'decide', e, u], { encoding: 'utf8', env: Object.assign({}, process.env, { SEP_ROOT: ROOT }) });
    let dj = null; try { dj = JSON.parse(d.stdout); } catch (_) { }
    check('decide escalates on exhausted counter', dj && dj.action === 'ESCALATE', d.stdout.slice(0, 200) + d.stderr.slice(0, 200));
    // 3. schema validation rejects a bad artifact
    const errs = validate({ verdict: 'MAYBE' }, BLIND_SCHEMA);
    check('schema validation rejects bad artifact', errs.length > 0, errs.slice(0, 2).join('; '));
    // 4. glob matcher sanity
    check('glob ** matches nested', globToRe('src/**').test('src/a/b.js') && !globToRe('src/**').test('lib/a.js'), '');
    check('glob {a,b} alternation', globToRe('**/*.{js,ts}').test('x/y.ts') && !globToRe('**/*.{js,ts}').test('x/y.py'), '');
    fs.rmSync(epicDir(e), { recursive: true, force: true });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  // 5. settings.json wires the hooks
  const settings = readJSON(path.join(ROOT, '.claude', 'settings.json'), {});
  const hs = JSON.stringify(settings.hooks || {});
  check('settings.json wires guard-write', hs.includes('guard-write'), '');
  check('settings.json wires guard-bash', hs.includes('guard-bash'), '');
  check('no funnel agent uses bypassPermissions', !(exists(path.join(ROOT, '.claude', 'agents')) && fs.readdirSync(path.join(ROOT, '.claude', 'agents')).some(f => f.startsWith('sep-') && /permissionMode:\s*bypassPermissions/.test(fs.readFileSync(path.join(ROOT, '.claude', 'agents', f), 'utf8')))), '');
  const ok = results.every(r => r.ok);
  writeJSON(path.join(SEP, 'selftest.json'), { ok, at: nowISO(), results, settings_sha: sha256(hs) });
  for (const r of results) process.stdout.write(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.ok ? '' : ' — ' + r.detail}\n`);
  process.stdout.write(`${ok ? 'SELFTEST PASSED' : 'SELFTEST FAILED'} (${results.filter(r => r.ok).length}/${results.length})\n`);
  if (!ok) process.exit(1);
};

// --- next: the deterministic state machine every driver (workflow, bash, human) follows -------
commands.next = ({ pos }) => {
  const e = pos[0]; if (!e) fail('usage: sep next <epic>');
  const d = epicDir(e); if (!exists(d)) fail(`no epic ${e}`);
  const st = loadState(e); const pol = policy(); const cls = st.class || 'T1'; const lane = pol.lanes[cls];
  const has = (f) => exists(path.join(d, f));
  const res = (step, extra) => out(Object.assign({ epic: e, step, class: st.class || null, stage: st.stage }, extra || {}));
  if (st.killed) return res('done', { reason: 'killed' });
  if (!has('triage.json') || !has('ACCEPTANCE.md')) return res('triage', { request: fs.readFileSync(path.join(d, 'request.md'), 'utf8').trim(), has_zones: (zonesCfg().zones || []).length > 0 });
  if (st.stage === 'intake') return res('classify');
  if (st.stage === 'classified') {
    const ic = readJSON(path.join(d, 'intent-check.json'), {});
    const tri = readJSON(path.join(d, 'triage.json'), {});
    const qs = (tri.questions || []).filter(q => q && q.text);
    const noDefault = qs.some(q => !q.default);
    const needHuman = (CLASSES.indexOf(cls) >= 2 && ((tri.ambiguity || 0) >= 0.5 || qs.length)) || ic.mismatch === true || noDefault;
    if (needHuman && !has('answers.md')) { if (!has('questions.md')) fs.writeFileSync(path.join(d, 'questions.md'), '# Questions (answer in answers.md; a missing answer means the default)\n' + qs.map(q => `- ${q.id || ''}: ${q.text}\n  default: ${q.default || '(none)'} — ${q.why || ''}`).join('\n') + (ic.mismatch ? '\n- INTENT: the independent reading of the request differs from the triage: ' + JSON.stringify(ic.missing || []) : '') + '\n'); return res('ask', { gate: 'H0', questions: qs, intent_mismatch: ic.mismatch === true, file: path.join(d, 'questions.md') }); }
    if ((st.unmapped_paths || []).length && !has('zones.patch.json')) return res('cartography', { unmapped: st.unmapped_paths });
    return res('plan', { lane, retry: st.plan_errors || null });
  }
  if (st.stage === 'plan_failed') return res(st.plan_failures >= 2 ? 'human' : 'plan', { gate: 'H3', reason: 'plan check failed twice', errors: st.plan_errors });
  if (st.stage === 'planned') {
    const nUnits = Object.keys(st.units).length;
    if (!st.audited && (CLASSES.indexOf(cls) >= 2 || nUnits > 1)) return res('audit');
    const toSpike = Object.entries(st.units).filter(([u, s]) => s.stage === 'planned' && cls !== 'T0').map(([u]) => u);
    if (toSpike.length) return res('spike', { units: toSpike });
    if (CLASSES.indexOf(cls) >= 2 && !has('CONTRACTS_APPROVED')) return res('human', { gate: 'H1', file: path.join(d, 'contracts-packet.md') });
    st.stage = 'building'; saveState(e, st);
  }
  if (st.stage === 'building' || st.stage === 'replan') {
    const units = st.units; const dag = readJSON(path.join(d, 'dag.json'), { units: [] }); const deps = Object.fromEntries((dag.units || []).map(u => [u.id, u.depends_on || []]));
    const asks = Object.entries(units).filter(([, s]) => s.stage === 'ask'); if (asks.length) return res('ask', { gate: 'H0', units: asks.map(([u]) => u), reason: 'a reviewer found the request ambiguous; see units/<u>/defects' });
    const replan = Object.entries(units).filter(([, s]) => s.stage === 'replan').map(([u]) => u); if (replan.length) return res('replan', { units: replan });
    const approved = Object.entries(units).filter(([u, s]) => s.stage === 'awaiting_human' && exists(path.join(unitDir(e, u), 'MERGE_APPROVED'))).map(([u]) => u); if (approved.length) return res('merge', { units: approved });
    const active = new Set(['planned', 'spiked', 'execute', 'executed', 'gated', 'gate_failed', 'inspect', 'inspected', 'blind', 'blinded', 'merge', 'card', 'spike']);
    const ready = Object.entries(units).filter(([u, s]) => active.has(s.stage) && !s.parked && (deps[u] || []).every(dd => units[dd] && units[dd].merged)).map(([u, s]) => { const cd = loadCard(e, u) || {}; return { id: u, stage: s.stage, round: s.round || 0, class: s.class || cls, acceptance: cd.acceptance || [], title: cd.title || '' }; });
    if (ready.length) return res('units', { units: ready.slice(0, Math.min(5, ready.length)), lane });
    const waiting = Object.entries(units).filter(([, s]) => s.stage === 'awaiting_human').map(([u]) => u); if (waiting.length) return res('human', { gate: 'H2', units: waiting });
    const parked = Object.entries(units).filter(([, s]) => s.parked).map(([u]) => u);
    const blocked = Object.entries(units).filter(([u, s]) => !s.merged && !s.parked && (deps[u] || []).some(dd => units[dd] && units[dd].parked)).map(([u]) => u);
    if (parked.length && !st.acknowledged_parked) return res('human', { gate: 'H3', units: parked, blocked, file: path.join(d, 'merge-cards') });
    st.stage = 'learn'; saveState(e, st);
  }
  if (st.stage === 'learn') return res('learn', { merged: Object.entries(st.units).filter(([, s]) => s.merged).map(([u]) => u), parked: Object.entries(st.units).filter(([, s]) => s.parked).map(([u]) => u) });
  return res('done', { merged: Object.entries(st.units).filter(([, s]) => s.merged).map(([u]) => u), parked: Object.entries(st.units).filter(([, s]) => s.parked).map(([u]) => u) });
};

// --- human actions ---------------------------------------------------------------------------
commands.answer = ({ pos }) => {
  const e = pos[0]; const text = pos.slice(1).join(' '); if (!e || !text) fail('usage: sep answer <epic> "<answers or rulings text>"');
  fs.appendFileSync(path.join(epicDir(e), 'answers.md'), text + '\n');
  appendLine(path.join(SEP, 'rulings.md'), `- R${Date.now().toString(36)} [${e}] ${text.replace(/\n/g, ' ')} (human, ${nowISO().slice(0, 10)})`);
  const st = loadState(e);
  for (const [u, s] of Object.entries(st.units)) if (s.stage === 'ask') { s.stage = 'execute'; s.round = (s.round || 0) + 1; }
  saveState(e, st); metric(e, null, { stage: 'human', event: 'answer' });
  out({ ok: true, answers: path.join(epicDir(e), 'answers.md') });
};
commands.approve = ({ pos, opt }) => {
  const e = pos[0]; if (!e) fail('usage: sep approve <epic> [<unit>] [--contracts] [--kill]');
  if (opt.contracts) { fs.writeFileSync(path.join(epicDir(e), 'CONTRACTS_APPROVED'), nowISO() + '\n'); metric(e, null, { stage: 'human', event: 'contracts_approved' }); return out({ ok: true, gate: 'H1' }); }
  if (opt.kill) { const st = loadState(e); st.killed = true; saveState(e, st); return out({ ok: true, killed: e }); }
  const u = pos[1]; if (!u) fail('unit required');
  fs.writeFileSync(path.join(unitDir(e, u), 'MERGE_APPROVED'), nowISO() + '\n');
  const st = loadState(e); const us = unitState(st, u); if (us.parked && opt.resume) { delete us.parked; us.stage = opt.resume; st.acknowledged_parked = true; }
  saveState(e, st); metric(e, u, { stage: 'human', event: 'approved' });
  out({ ok: true, gate: 'H2', unit: u });
};
commands['check-integration'] = ({ pos }) => {
  const e = pos[0]; if (!e) fail('usage: sep check-integration <epic>');
  const pol = policy(); const ib = pol.integration_branch || 'integration';
  const st = loadState(e); const zonesTouched = new Set();
  for (const [u, s] of Object.entries(st.units)) if (s.merged) { const card = loadCard(e, u); if (card) zonesTouched.add(card.zone); }
  const results = withWorktree(ib, (wt) => [...zonesTouched].map(z => { const zone = zoneById(z); return { zone: z, test: runCmd(zone.commands.test, wt, pol.gate.max_gate_seconds), invariants: (zone.invariants || []).filter(i => i.check).map(i => Object.assign({ text: i.text }, runCmd(i.check, wt, pol.gate.max_gate_seconds))) }; }));
  const ok = results.every(r => r.test.ok && r.invariants.every(i => i.ok));
  writeJSON(path.join(epicDir(e), 'integration-check.json'), { ok, results, at: nowISO() });
  metric(e, null, { stage: 'integrate', event: 'check', ok });
  out({ ok, zones: results.map(r => ({ zone: r.zone, test: r.test.ok, invariants: r.invariants.map(i => i.ok) })) });
  if (!ok) process.exit(1);
};

// --- lint: the repository's own checks for the funnel files ---------------------------------------
commands.lint = () => {
  const problems = [];
  const wfDir = path.join(ROOT, '.claude', 'workflows');
  if (exists(wfDir)) for (const f of fs.readdirSync(wfDir).filter(f => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(wfDir, f), 'utf8');
    if (!/^export const meta = \{/m.test(src)) problems.push(`${f}: missing 'export const meta = {'`);
    if (/Date\.now\(|Math\.random\(|new Date\(\)/.test(src)) problems.push(`${f}: Date.now/Math.random/new Date() break workflow resume`);
    const body = src.replace(/^export const meta = /m, 'const meta = ');
    try { new (Object.getPrototypeOf(async function () { }).constructor)('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', 'budget', 'workflow', body); } catch (e) { problems.push(`${f}: ${e.message}`); }
  }
  const settings = path.join(ROOT, '.claude', 'settings.json'); if (exists(settings)) { try { readJSON(settings); } catch (e) { problems.push('settings.json: ' + e.message); } }
  const agDir = path.join(ROOT, '.claude', 'agents');
  if (exists(agDir)) for (const f of fs.readdirSync(agDir).filter(f => f.endsWith('.md'))) {
    const a = parseAgentFile(path.join(agDir, f)); const fm = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(path.join(agDir, f), 'utf8'));
    if (!fm) { problems.push(`agents/${f}: no frontmatter`); continue; }
    const name = /^name:\s*(.+)$/m.exec(fm[1]); if (!name || name[1].trim() + '.md' !== f) problems.push(`agents/${f}: name must equal the file name`);
    if (!/^description:\s*.+/m.test(fm[1])) problems.push(`agents/${f}: description required`);
    if (/permissionMode:\s*bypassPermissions/.test(fm[1])) problems.push(`agents/${f}: bypassPermissions is forbidden for funnel agents`);
    if (!a.prompt || a.prompt.length < 80) problems.push(`agents/${f}: body (system prompt) too short`);
  }
  const scDir = path.join(SEP, 'schemas'); if (exists(scDir)) for (const f of fs.readdirSync(scDir)) { try { readJSON(path.join(scDir, f)); } catch (e) { problems.push(`schemas/${f}: ${e.message}`); } }
  const skDir = path.join(ROOT, '.claude', 'skills'); if (exists(skDir)) for (const d of fs.readdirSync(skDir)) { const sk = path.join(skDir, d, 'SKILL.md'); if (!exists(sk)) { problems.push('skills/' + d + ': SKILL.md missing'); continue; } const txt = fs.readFileSync(sk, 'utf8'); const nm = /^name:\s*(.+)$/m.exec(txt); if (!nm || nm[1].trim() !== d) problems.push('skills/' + d + ': frontmatter name must be ' + d); }
  out({ ok: !problems.length, problems });
  if (problems.length) process.exit(1);
};

// ---------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------
(function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const fn = commands[cmd] || commands.help;
  try { fn(parseArgs(rest)); } catch (e) { fail(e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e)); }
})();
