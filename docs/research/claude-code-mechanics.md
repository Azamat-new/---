# Claude Code extension mechanisms — verified reference (docs fetched 2026-09-26)

Sources: https://code.claude.com/docs/en/sub-agents.md, /skills.md, /hooks.md, /hooks-guide.md, /workflows.md, /memory.md, /worktrees.md, /agent-teams.md, /headless.md

## 1. Custom subagents: `.claude/agents/<name>.md`
Frontmatter fields (all verified):
| Field | Values / notes |
|---|---|
| `name` (req) | unique id, no `:`; used to spawn |
| `description` (req) | when Claude should delegate to it |
| `tools` | allow-list: comma string `Read, Grep, Glob, Bash` or YAML list; MCP patterns `mcp__github`, `mcp__*`; restrict spawnable subagents: `Agent(worker, researcher)` |
| `disallowedTools` | same format; removes tools from inherited list (e.g. `Write, Edit, Agent`) |
| `model` | `sonnet` / `opus` / `haiku` / `fable` alias, full id (`claude-opus-5-5`), or `inherit` |
| `permissionMode` | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`, `manual` |
| `maxTurns` | integer |
| `skills` | list of skill names preloaded into context |
| `mcpServers` | list |
| `hooks` | PreToolUse / PostToolUse / Stop handlers scoped to this agent |
| `memory` | `user` / `project` / `local` |
| `background` | bool |
| `omitClaudeMd` | bool — **skip CLAUDE.md injection** (useful for a truly context-free reviewer) |
| `effort` | `low` / `medium` / `high` / `xhigh` / `max` |
| `isolation` | `worktree` — agent runs in a temporary git worktree; removed if unchanged |
| `color` | red, blue, green, yellow, purple, orange, pink, cyan |
The markdown body **replaces** the system prompt for that subagent (it is the complete system prompt).
Subagents can spawn subagents up to 3 levels (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`); omit `Agent` from `tools` or put it in `disallowedTools` to prevent.

Example:
```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and best practices
tools: Read, Grep, Glob, Bash
model: inherit
maxTurns: 25
effort: high
---
You are a code quality reviewer. ...
```

## 2. Skills: `.claude/skills/<name>/SKILL.md`
Frontmatter: `name`, `description`, `when_to_use`, `argument-hint`, `arguments: [a, b]`, `disable-model-invocation`, `user-invocable`, `allowed-tools` (e.g. `Bash(git diff *)`), `disallowed-tools`, `model`, `effort`, `context: fork`, `agent: Explore|Plan|general-purpose|<custom agent name>`, `background`, `paths`, `shell`, `hooks`.
Substitution: `$ARGUMENTS` (all), `$ARGUMENTS[N]` / `$N` (0-based), `$name` for named `arguments`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`.
Shell injection: inline `` !`git status --short` `` or a fenced block with language `!` (multi-line). Runs in CWD, 2-min timeout, non-zero exit aborts (use `|| true`).
`context: fork` runs the skill body as the prompt of an isolated subagent (no conversation history); `agent:` picks the subagent type.

## 3. Hooks: `.claude/settings.json`
```json
{ "hooks": { "PreToolUse": [ { "matcher": "Bash", "if": "Bash(git push *)",
   "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-push.sh", "timeout": 30 } ] } ] } }
```
Hook types: `command`, `http`, `mcp_tool`, `prompt`, `agent`.
Events: SessionStart, SessionEnd, Setup, UserPromptSubmit, Stop, StopFailure, PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, FileChanged, CwdChanged, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Notification, InstructionsLoaded, ...
Matcher: `*`/empty = all; exact names `Bash`, `Edit|Write`; regex if other chars.
stdin JSON (common): `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, `agent_id`, `agent_type`, plus `tool_name`, `tool_input` for tool events.
Blocking: exit code **2** blocks (message from stderr or JSON `reason`); exit 0 = allow (may print JSON: `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow|deny|ask","permissionDecisionReason":"...","additionalContext":"..."}}`).
Example guard script:
```bash
#!/bin/bash
COMMAND=$(jq -r '.tool_input.command // ""')
if echo "$COMMAND" | grep -Eq '^git push'; then
  [ -f "${CLAUDE_PROJECT_DIR}/.separator/.push-approved" ] || { echo "push blocked: no verdict" >&2; exit 2; }
fi
exit 0
```

## 4. Workflows: `.claude/workflows/<name>.js`
Project workflows live in `.claude/workflows/` (user-level: `~/.claude/workflows/`); runnable as `/<name>`; plugin workflows namespaced `/plugin:name`.
Format: plain JS module, `export const meta = { name, description, phases:[...] }` (pure literal), then top-level `await` body using `agent(prompt, {schema,label,phase,model,effort,isolation:'worktree',agentType})`, `pipeline(items, ...stages)`, `parallel(thunks)`, `phase(title)`, `log(msg)`, `args`, `budget`, `workflow(nameOrRef, args)` (one-level nesting; documented in the session's authoring reference, not in public docs → keep scripts standalone-capable).
`/workflows` lists runs; `s` saves a run as a command. No `Date.now()`/`Math.random()` in scripts (breaks resume).

## 5. Memory: CLAUDE.md and `.claude/rules/`
Hierarchy: managed → `~/.claude/CLAUDE.md` → project `./CLAUDE.md` or `./.claude/CLAUDE.md` (root→cwd) → `./CLAUDE.local.md` (gitignored). `@path` imports (max 4 hops; skipped inside code spans).
`.claude/rules/*.md` loaded at launch; optional frontmatter `paths: ["src/api/**/*.ts"]` makes a rule path-scoped (only `paths` is read).

## 6. Worktrees
`claude --worktree <name>` → `.claude/worktrees/<name>/`, branched from default branch (or `worktree.baseRef: "head"`). Subagent `isolation: worktree` → temporary worktree per agent, auto-removed if unchanged. Isolation is enforced: edits / bash cwd / git redirects into the main checkout are blocked.

## 7. Headless structured output
`claude -p "<prompt>" --output-format json --json-schema '<schema>' | jq '.structured_output'`; `.result` for text; `stream-json` for streaming; 5 validation retries (`MAX_STRUCTURED_OUTPUT_RETRIES`). Enables a bash-only runner of the funnel.

## 8. Agent teams (experimental)
`"env": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}`; lead + teammates (separate sessions), shared task list `.claude/tasks/<team>/`, mailboxes, `SendMessage`, `TaskCreate/TaskGet/TaskList/TaskUpdate`. Limitations: no resume of teammates, one team per session, no nested teams. Treat as optional; the reference implementation must not depend on it.

## 9. EMPIRICAL FINDINGS in this environment (Claude Code 2.1.283, tested 2026-09-26) — THESE OVERRIDE ASSUMPTIONS
1. **Custom agents are registered only at session start.** `.claude/agents/*.md` written mid-session are NOT visible to the
   Workflow `agentType` registry nor to the Agent tool; `agent(prompt,{agentType:'x'})` with an unknown type THROWS
   ("agent type 'x' not found. Available agents: claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup")
   and kills the workflow unless caught. A FRESH process (`claude -p` in the project dir) does load them. Consequence:
   workflow scripts must wrap agentType calls in try/catch and fall back to the default agent with a "read your role card
   at .claude/agents/<name>.md and follow it" prompt; installation docs must say "restart Claude Code".
2. **settings.json hooks are hot-reloaded** (a hook added mid-session fired on the next tool call). `CLAUDE_PROJECT_DIR`
   is set for hook commands. Hook stdin JSON includes `agent_type` (e.g. `sep-probe-test` for an Agent-tool subagent,
   `workflow-subagent` for a workflow agent without agentType, `-`/absent for the main session) and `cwd`, which for a
   worktree-isolated agent is the WORKTREE path (`<project>/.claude/worktrees/<runId>-<n>`), while `CLAUDE_PROJECT_DIR`
   stays the main checkout. Consequence: role-scoped enforcement lives in GLOBAL settings.json hooks that branch on
   `agent_type` and on `cwd`/branch, not in agent frontmatter.
3. **Agent frontmatter `hooks:` did NOT fire** (tested PreToolUse/Bash with absolute and `${CLAUDE_PROJECT_DIR}` paths,
   agent spawned via Agent tool in a fresh process). Do not rely on frontmatter hooks. (`omitClaudeMd: true`, `tools:`
   restrictions are documented and the agent loaded fine with them.)
4. **`isolation: 'worktree'` for workflow agents works**: cwd = `<project>/.claude/worktrees/<runId>-<n>`, branch
   `worktree-<runId>-<n>` created from the session HEAD; the worktree shares `.git`, so branches/commits made inside it
   are visible from the main checkout; the worktree is locked and removed if unchanged. The agent can run local git
   commands inside it. Agents may REFUSE mutations that look unrelated to the user's last message — prompts must state
   explicitly that the workflow authorizes the specific branch/commit/file operations.
5. **Headless blind sandbox works**: from a directory OUTSIDE the project,
   `claude -p --restricted --tools "Read,Grep,Glob,Bash" --allowedTools "Bash,Read,Grep,Glob" --agents <agents.json>
   --agent <name> --settings <hooks.json> --output-format json --json-schema '<schema>' "<prompt>"`
   runs a role from a JSON definition; `--restricted` confines Read/Grep/Glob to cwd (a Read of a project file was
   DENIED), ignores user/project/local settings (only `--settings` applies), and `Bash` is available only when named in
   `--tools` AND pre-approved via `--allowedTools` (otherwise every command is a permission denial in -p mode).
   Bash is NOT confined by --restricted (`ls ..` succeeded), so a PreToolUse Bash hook passed via `--settings` must deny
   commands containing `..`, the project path, `/home`, `/root`, `~`, `$HOME`, `.separator`, `.claude`, `CLAUDE.md`,
   `git log|reflog|show|branch|show-ref|tag`, `.git/`; hook denials show up in `permission_denials` of the JSON result.
   `--agents` file format: `{"<name>": {"description": "...", "prompt": "<system prompt>", "tools": ["Read","Bash"], "model": "..."}}`.
   OAuth auth was reused by the nested process (no `--bare` needed; `--bare` would require ANTHROPIC_API_KEY).
   CLAUDE.md is not auto-discovered when cwd is outside the project tree. `--json-schema` with `--agent`: verify the
   `structured_output` field in the result; if absent, parse `result` text as JSON (schema is still enforced on the model).
6. **Nested `claude -p` from a Bash tool call works** (main session and, by the same mechanism, subagents); cost ≈ a
   normal call. The reference implementation uses it for the blind lenses (`sep blind`) and it works even before a
   session restart (independent of the agent registry).
7. Harness concurrency here: 4 CPUs → at most 2 concurrent workflow agents per workflow.
