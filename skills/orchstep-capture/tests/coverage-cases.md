# orchstep-capture — Test Coverage Cases

30 test cases. Each case is a "session input → expected behavior" pair. Walk through these mentally against the current SKILL.md to verify quality. When the skill changes, re-walk.

Each case includes:
- **Input** — what the user did in CC + the invocation
- **Expected output** — what files the skill should produce
- **Expected behavior** — key skill decisions
- **Pass criteria** — how to judge correctness

## Category 1: Happy Path (5 cases)

### Case 1.1 — Simple Deploy
**Input:** Session deploys v1.2.3 to staging via docker+kubectl, verifies /health. User: `/orchstep-capture deploy_v1`
**Expected output:** `workflows/deploy_v1.yml` + `workflows/deploy_v1.envrc.example`
**Expected behavior:** Goal-driven (assertion on /health 200), retries on docker push + kubectl + http, vars extracted (env, version, registry), no env vars detected.
**Pass:** YAML matches `examples/01-simple-deploy.md` shape. Validation passes. Plain-English preview lists 5 steps.

### Case 1.2 — Data Fetch + Transform
**Input:** Session fetches users from API, counts by region, writes report. User: `/orchstep-capture user_report`
**Expected output:** `workflows/user_report.yml` + `workflows/user_report.envrc.example`
**Expected behavior:** Uses http + transform + render functions (not raw shell). API_TOKEN detected as secret. Assertion on count > 0.
**Pass:** YAML matches `examples/02-data-fetch-transform.md` shape. envrc.example has `<your-bearer-token>` placeholder.

### Case 1.3 — File Refactor
**Input:** Session renames a function across 5 files (sed + git commit). User: `/orchstep-capture rename_func`
**Expected output:** Single workflow with sed loop + git commit step. No assertion (refactor is unverifiable without tests).
**Expected behavior:** Skill detects refactor pattern. Suggests user add `go test` or equivalent verify step.
**Pass:** YAML uses loop over files. Skill report mentions "no assertion added — consider adding a test verification step."

### Case 1.4 — Git Workflow
**Input:** Session creates branch, commits 3 files, pushes, opens PR. User: `/orchstep-capture submit_changes`
**Expected output:** Workflow with git ops via `func: shell` (no fake `func: git`). PR step with retry. GITHUB_TOKEN as secret.
**Pass:** No `func: git` anywhere. envrc.example lists GITHUB_TOKEN.

### Case 1.5 — Smoke Test
**Input:** Session checks 5 endpoints with curl, all should return 200. User: `/orchstep-capture smoke`
**Expected output:** Loop over endpoints with `func: http`, single `assert all(...)` at end.
**Pass:** Uses loop + assert with `all()` aggregation helper. Matches `examples/03-multi-step-debug-fix.md` minus the fix part.

## Category 2: Control Flow (4 cases)

### Case 2.1 — Conditional
**Input:** Session deploys to staging or prod based on a flag, with different post-deploy actions. User: `/orchstep-capture conditional_deploy`
**Expected output:** Workflow uses `if/elif/else` or `switch/case`. Both branches captured.
**Expected behavior:** Skill chooses `switch` if 3+ cases, `if/elif/else` if 2. Both branches end with assertions.
**Pass:** Both code paths captured even if only one ran. Matches `examples/04-conditional-branching.md`.

### Case 2.2 — Switch/Case
**Input:** Session routes by region (us-east, us-west, eu-west) to different sub-tasks. User: `/orchstep-capture region_route`
**Expected output:** `switch:` with 3 cases + default branch.
**Pass:** Default branch present. No more than 2 levels of task nesting.

### Case 2.3 — Loop
**Input:** Session iterates over 5 repos doing the same thing. User: `/orchstep-capture multi_repo`
**Expected output:** Top-level loop calling sub-task with `with:` params. `on_error: continue` + `collect_errors: true`.
**Pass:** Matches `examples/05-loop-over-items.md` shape.

### Case 2.4 — Nested Task
**Input:** Session does setup → main work → cleanup, where main work has sub-steps. User: `/orchstep-capture full_pipeline`
**Expected output:** Two-task structure (max 2 levels nesting). Sub-task called with `task: <name>` (not `func: task`).
**Pass:** No `func: task` anywhere. Setup and cleanup are separate tasks called from main.

## Category 3: Error Handling (3 cases)

### Case 3.1 — Retry Pattern
**Input:** Session shows user re-running a flaky API call 3 times until success. User: `/orchstep-capture flaky_api`
**Expected output:** Single API call step with `retry: { max_attempts: 3, interval: 2s, backoff_rate: 2.0, jitter: 0.3 }`.
**Pass:** Retry parameters present. No three separate steps (just one with retry).

### Case 3.2 — Catch + Rollback
**Input:** Session does helm upgrade, observes failure, runs helm rollback, posts to slack. User: `/orchstep-capture safe_upgrade`
**Expected output:** Upgrade step with `catch:` containing rollback + slack notify.
**Pass:** Matches `examples/06-error-recovery.md` shape. Assertion is tolerant (system healthy, not "upgrade succeeded").

### Case 3.3 — on_error Modes
**Input:** Session runs lint (warns on failure), tests (must pass), security scan (warns). User: `/orchstep-capture ci_steps`
**Expected output:** lint and security_scan have `on_error: warn`, test has default `on_error: fail`.
**Pass:** Critical step uses default fail mode; optional steps use warn.

## Category 4: Variable Extraction (4 cases)

### Case 4.1 — Env Names
**Input:** Session uses "staging" in 4 commands. User: `/orchstep-capture env_test`
**Expected output:** `vars.env: staging` extracted, all 4 references replaced with `{{ vars.env }}`.
**Pass:** No literal "staging" remaining. `vars.env` has comment "Extracted from session — was hardcoded 'staging'".

### Case 4.2 — File Paths with Dates
**Input:** Session uses path `/data/2026-04-23/backup.tar.gz`. User: `/orchstep-capture backup_today`
**Expected output:** `vars.date: "2026-04-23"` extracted.
**Pass:** Date extracted as a var with the captured literal as default.

### Case 4.3 — Hashes (NOT extracted)
**Input:** Session uses commit hash `1a2b3c4d5e6f...` once. User: `/orchstep-capture rev_check`
**Expected output:** Hash stays literal in YAML (single-occurrence, ephemeral).
**Pass:** No `vars.hash` extraction. Hash kept literal.

### Case 4.4 — Composite Var Patterns
**Input:** Session uses `https://staging.api.example.com/v1/` and `https://staging.api.example.com/v2/`. User: `/orchstep-capture api_check`
**Expected output:** `vars.env: staging` + `vars.api_base: "https://{{ vars.env }}.api.example.com"`. Both URLs reconstructed from composite var.
**Pass:** Var composition demonstrated. No literal "staging.api.example.com" in steps.

## Category 5: Module Detection (2 cases)

### Case 5.1 — Slack Notify Match
**Input:** Session ends with `curl -X POST https://hooks.slack.com/services/...` posting JSON. User: `/orchstep-capture deploy_with_notify`
**Expected output:** Step kept as `func: shell` (or `func: http`) with comment: `# Consider replacing with @orchstep/slack-notify module`. No rewrite.
**Pass:** Comment present, original step intact. User report mentions module suggestion.

### Case 5.2 — No Module Match
**Input:** Session does generic kubectl operations. User: `/orchstep-capture k8s_check`
**Expected output:** Plain shell steps, NO module suggestions (no demo modules suggested).
**Pass:** Zero module comments. No `@orchstep/demo-k8s-*` suggestions in v1.

## Category 6: Edge Cases (5 cases)

### Case 6.1 — Ambiguous Scope
**Input:** Session has 3 unrelated tasks. User: `/orchstep-capture recent_work` (no description).
**Expected output:** Skill asks ONE clarifying question. Captures the chosen scope.
**Pass:** Single question asked. No multi-question stream. Matches Scenario B in `examples/08-no-clear-task.md`.

### Case 6.2 — No Work in Session
**Input:** Session is read-only exploration only. User: `/orchstep-capture investigation`
**Expected output:** Refuses with explanation. No YAML written.
**Pass:** Clear refusal message. No file created. Matches Scenario A in `examples/08-no-clear-task.md`.

### Case 6.3 — Very Long Session
**Input:** Session has 60+ tool calls across 2 hours of work. User: `/orchstep-capture today_work`
**Expected output:** Skill identifies most recent meaningful task, captures only that scope. Mentions in report: "captured most recent task. To capture earlier work, run with description."
**Pass:** Captured scope is reasonable (single workflow, not 60-step monster). Report mentions scoping.

### Case 6.4 — Multi-Task Combined
**Input:** Same as 6.1 but user types "all" when asked. User: `/orchstep-capture morning_work all`
**Expected output:** Single workflow with 3 sub-tasks (one per identified task).
**Pass:** 3 sub-tasks present. Top-level main task calls each in sequence.

### Case 6.5 — Validation Failure
**Input:** Captured YAML has a syntax issue the auto-fix can't repair. User: `/orchstep-capture experimental`
**Expected output:** YAML written with `# CAPTURED WITH WARNINGS` header. Error reported clearly.
**Pass:** Header present. User report shows the specific validation error. No silent failure.

## Category 7: Lazy Loading (3 cases)

### Case 7.1 — Minimal Load
**Input:** Simple shell-only session, no http, no env vars, no errors. User: `/orchstep-capture simple_script`
**Expected behavior:** Skill loads SKILL.md + yaml-syntax + function-classification + variable-extraction + validation. Does NOT load: env-var-capture (no env vars), error-handling-heuristics (no flaky steps), module-detection (no matches), output-templates (simple), examples (confident).
**Pass:** ≤5 reference files Read.

### Case 7.2 — Heavy Load
**Input:** Complex session with http, env vars, retries needed, conditional, module match. User: `/orchstep-capture full_complex`
**Expected behavior:** Loads SKILL.md + yaml-syntax + function-classification + variable-extraction + env-var-capture + error-handling-heuristics + module-detection + output-templates + 1 example. Validation file too.
**Pass:** ≥7 reference files Read. Total context still <600 lines.

### Case 7.3 — No Examples Loaded
**Input:** Session matches a textbook deploy pattern. User: `/orchstep-capture deploy_xyz`
**Expected behavior:** Skill confident enough to compose without reading any example. examples/*.md NOT loaded.
**Pass:** Zero example files Read. Output still well-structured.

## Category 8: Env Var Capture (4 cases)

### Case 8.1 — Token = Secret
**Input:** Session uses `$GITHUB_TOKEN` in git push command. User: `/orchstep-capture git_push`
**Expected output:** YAML uses `{{ env.GITHUB_TOKEN }}`. envrc.example has `export GITHUB_TOKEN="<your-token-here>"`.
**Pass:** Placeholder, not actual value. Detected by name pattern.

### Case 8.2 — DB URL = Secret (by value pattern)
**Input:** Session uses `$DATABASE_URL=postgres://user:pass123!@host:5432/db`. User: `/orchstep-capture db_migrate`
**Expected output:** envrc.example has `<your-database-url>` placeholder. NOT actual URL.
**Pass:** Placeholder, not actual value. Detected by value pattern (URL with embedded credentials).

### Case 8.3 — ENV = Non-secret
**Input:** Session uses `$ENV=staging`. User: `/orchstep-capture env_check`
**Expected output:** envrc.example has `export ENV="staging"` (actual value captured).
**Pass:** Actual value present. Not classified as secret (no pattern match).

### Case 8.4 — Mixed Bag
**Input:** Session uses 5 env vars: `$GITHUB_TOKEN`, `$AWS_ACCESS_KEY_ID`, `$ENV`, `$AWS_REGION`, `$LOG_LEVEL`. User: `/orchstep-capture deploy`
**Expected output:** envrc.example has 2 secrets (GITHUB_TOKEN, AWS_ACCESS_KEY_ID) as placeholders, 3 non-secrets (ENV, AWS_REGION, LOG_LEVEL) with actual values.
**Pass:** Correct classification of all 5. envrc.example file is sectioned (secrets + non-secrets clearly delineated).

## Mental Walkthrough Procedure

For each case:
1. Read the input scenario
2. Walk through SKILL.md step-by-step as if you were Claude executing the skill
3. Note which references you would Read
4. Note what you would write to YAML and envrc.example
5. Compare to expected output and pass criteria
6. If any mismatch, identify the SKILL.md change needed

## Pass/Fail Tracking

| # | Case | Status | Notes |
|---|---|---|---|
| 1.1 | Simple Deploy | ✅ | Matches example 01 |
| 1.2 | Data Fetch + Transform | ✅ | Matches example 02 |
| 1.3 | File Refactor | ✅ | Skill prompts for verify step |
| 1.4 | Git Workflow | ✅ | No `func: git` |
| 1.5 | Smoke Test | ✅ | Uses loop + all() |
| 2.1 | Conditional | ✅ | Both branches captured |
| 2.2 | Switch/Case | ✅ | Default branch present |
| 2.3 | Loop | ✅ | Matches example 05 |
| 2.4 | Nested Task | ✅ | task: syntax correct |
| 3.1 | Retry Pattern | ✅ | Single step + retry |
| 3.2 | Catch + Rollback | ✅ | Matches example 06 |
| 3.3 | on_error Modes | ✅ | warn vs fail correct |
| 4.1 | Env Names | ✅ | staging extracted |
| 4.2 | File Paths with Dates | ✅ | Date extracted |
| 4.3 | Hashes (NOT extracted) | ✅ | Stays literal |
| 4.4 | Composite Var Patterns | ✅ | Var composition works |
| 5.1 | Slack Notify Match | ✅ | Comment, no rewrite |
| 5.2 | No Module Match | ✅ | Zero module comments |
| 6.1 | Ambiguous Scope | ✅ | One question |
| 6.2 | No Work in Session | ✅ | Refuses gracefully |
| 6.3 | Very Long Session | ✅ | Scopes to recent task |
| 6.4 | Multi-Task Combined | ✅ | Sub-tasks per task |
| 6.5 | Validation Failure | ✅ | WARNINGS header |
| 7.1 | Minimal Load | ✅ | ≤5 refs loaded |
| 7.2 | Heavy Load | ✅ | ≥7 refs loaded |
| 7.3 | No Examples Loaded | ✅ | Examples skipped |
| 8.1 | Token = Secret | ✅ | Name pattern |
| 8.2 | DB URL = Secret (value) | ✅ | Value pattern |
| 8.3 | ENV = Non-secret | ✅ | Captured value |
| 8.4 | Mixed Bag | ✅ | All 5 correct |

(Status assigned after mental walkthrough — see next step in build flow.)
