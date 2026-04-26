---
name: orchstep-capture
description: Capture the current Claude Code session's solved work as a clean replayable OrchStep YAML workflow. Use when the user has just finished a multi-step task (deploy, debug, refactor, data pipeline, infra change) and wants to replay or share it. Triggers on phrases like "capture this", "save this as a workflow", "make this replayable", "/orchstep-capture".
---

# OrchStep Capture

Convert what just happened in this Claude Code session into a clean, replayable OrchStep YAML workflow plus an env template.

## Invocation

```
/orchstep-capture <name> [optional description] [--raw] [--out PATH]
```

- `<name>` (required) — workflow name, used as filename: `workflows/<name>.yml`
- `[description]` (optional) — natural-language scope: "the deploy I just did", "the data fetch and transform"
- `--raw` — faithful transcript mode, no smart capture
- `--out PATH` — override save location

If invoked without arguments, ask the user once for `<name>` and proceed.

## Strategic Goal

Optimize for "average user adopts in 5 minutes." First capture works, first replay works, value felt fast. Don't expose every OrchStep feature; users discover depth on their own once hooked. Single YAML output, light module suggestions, replay = test. Anything heavier belongs in `orchstep-harden` (future skill).

## Workflow

Follow these steps in order. Load reference files lazily — only when the step explicitly says to.

### Step 1: Determine Scope

- If `[description]` provided → use it to identify which session events matter (e.g., "deploy" → focus on shell/http/git events near the deploy keyword and after the user said "deploy this").
- If no `[description]` → auto-detect last meaningful task. Signals: most recent completed TodoWrite item, most recent successful sequence of related shell commands, most recent natural ending ("looks good!", "that worked", commit made).
- If scope is genuinely ambiguous (multiple unrelated tasks recently completed) → ask ONE clarifying question: "I see N recent tasks: (A) ..., (B) .... Which to capture? (Type a letter, or 'all' to combine into one workflow with sub-tasks)". If user picks 'all', emit ONE workflow whose `main` task calls each sub-task in sequence with `task:` + `with:`.
- If session is very long (60+ tool calls) → auto-scope to the most recent meaningful task and explicitly say in the final report: "Captured the most recent task. To capture earlier work, re-run with a `[description]` argument."
- If no meaningful work in scope → refuse politely: "I don't see substantial work to capture in the recent session. Try doing the work first, then run /orchstep-capture."

### Step 2: Identify the GOAL

What was the user trying to ACHIEVE? Multiple signals (use the strongest):
- The `[description]` argument
- User's natural-language statements at session start
- The verification commands at the end (curl /health, kubectl get pods, test runs) — these reveal implicit success criteria
- TodoWrite items: their text often states the goal
- Git commit messages

If no clear goal can be inferred, ask ONE question: "What was the goal? (e.g., 'deploy v1.2.3 to staging and verify health')". The goal becomes the workflow's `desc` and informs which `assert` steps to add.

### Step 3: Load YAML Syntax Reference

Read `references/yaml-syntax.md` now. This contains the canonical OrchStep YAML structure derived from the current engine spec.

### Step 4: Inventory Session Events

Walk back through your own recent tool-use history. Categorize each event:

- **Capture** — Bash commands that did real work, file edits, HTTP calls, git operations
- **Skip as noise** — `ls`, `cd`, `pwd`, `cat` (for inspection only), failed retries that succeeded later (just keep the success)
- **Skip as context** — Read tool calls (not user-actionable steps), grep/glob (search only)

Roughly 30-70% of session events should be skipped. A captured workflow is leaner than the session that produced it.

### Step 5: Classify Each Captured Event

Read `references/function-classification.md`.

For each captured event, decide which OrchStep `func:` it maps to. Most common mappings:
- `bash <cmd>` → `func: shell`
- `curl ...` → `func: http` (for clean structure) or `func: shell` (for compatibility)
- `git ...` → `func: shell` (git is shell-wrapped in OrchStep, not a dedicated function)
- A verification step → `func: assert`
- A pause/sleep → `func: wait`

### Step 6: Extract Variables

Read `references/variable-extraction.md`.

Find hardcoded values that should be `{{ vars.X }}`:
- Environment names (staging, production, dev) → `{{ vars.env }}`
- Version strings (1.2.3, v0.4.1) → `{{ vars.version }}`
- File paths with dates → `{{ vars.date }}` or `{{ vars.path }}`
- URLs containing env/version pieces → reconstruct with vars
- Repeated literals (same hostname in 3 places) → `{{ vars.host }}`

Add a workflow-top-level `defaults:` section with the extracted values. (Top-level field MUST be `defaults:` — `vars:` is only valid inside tasks/steps. Templates still reference all of them as `{{ vars.X }}` because every scope is merged into the runtime `vars` namespace.)

### Step 7: Capture Env Vars and Secrets

Read `references/env-var-capture.md`.

Scan captured commands for `$VAR_NAME` and `${VAR_NAME}` references. For each:
- Classify by name pattern (TOKEN/KEY/SECRET/PASSWORD/CREDENTIAL/API_KEY/AUTH/CERT/PRIVATE → secret)
- Classify by value pattern (JWT, sk-..., ghp_..., AKIA..., long base64/hex → secret)
- Replace in YAML with `{{ env.VAR_NAME }}`

Generate `workflows/<name>.envrc.example`:
- Secrets: `export GITHUB_TOKEN="<your-token-here>"` (placeholder only, NEVER actual value)
- Non-secrets: `export ENV="staging"` (actual captured value)

### Step 8: Add Error Handling Where Warranted

Read `references/error-handling-heuristics.md` ONLY IF you spotted patterns that warrant retries (network calls, deploys, kubectl, curl health checks, anything flaky). Otherwise skip this load.

Common additions:
- Health check / verification → retry with interval
- Deploy commands → retry with catch-rollback
- HTTP calls to external services → retry with backoff

Do NOT add retries to deterministic local commands (echo, cat, simple file ops).

### Step 9: Detect Module Matches (Light Touch)

Read `references/module-detection.md` ONLY IF the captured pattern looks like a known module shape (Slack notification, health check, git release). Otherwise skip this load.

If a match is found, add a comment in the YAML: `# Consider replacing with @orchstep/<module> module`. Do NOT rewrite the steps. Module rewriting is the job of the future `orchstep-harden` skill.

### Step 10: Look Up a Precedent (Optional)

If the captured workflow shape is unfamiliar (you're unsure how to structure it), Read ONE matching example from `examples/`:
- Simple deploy → `examples/01-simple-deploy.md`
- Data fetch + transform → `examples/02-data-fetch-transform.md`
- Multi-step debug → `examples/03-multi-step-debug-fix.md`
- Conditional branching → `examples/04-conditional-branching.md`
- Loop over items → `examples/05-loop-over-items.md`
- Error recovery → `examples/06-error-recovery.md`
- HTTP + secrets → `examples/07-http-and-secrets.md`
- No clear task → `examples/08-no-clear-task.md`

Skip this step if confident.

### Step 11: Assemble and Write the YAML

Read `references/output-templates.md` ONLY IF a starter scaffold helps (deploy/data-pipeline/smoke-test patterns). Otherwise compose freehand from the events above.

Determine save location:
1. If current dir or any ancestor has `workflows/` → save there
2. Else if ancestor has `orchstep.yml` → save next to it as `workflows/<name>.yml`
3. Else → create `./workflows/<name>.yml` (mkdir if needed)
4. Override with `--out PATH` if provided

Conflict handling: if the file exists, ask the user: (A) overwrite, (B) save as `<name>-2.yml`, (C) cancel.

Write `workflows/<name>.yml` and `workflows/<name>.envrc.example`.

### Step 12: Validate

Read `references/validation.md`.

Run: `orchstep validate workflows/<name>.yml`

If validation fails: attempt ONE auto-fix pass (most failures are missing required fields, fixable from context). Re-validate. If still failing, write the YAML anyway with a `# CAPTURED WITH WARNINGS` header comment and report the specific error.

### Step 13: Generate Plain-English Preview

Walk the YAML and produce a numbered summary:
> This workflow will:
> 1. Build the docker image tagged `app:{{ vars.version }}`
> 2. Push it to the registry
> 3. Deploy to Kubernetes (with retry on failure)
> 4. Verify the /health endpoint returns 200 (up to 5 attempts)

This catches semantic mistakes that pass syntax validation.

### Step 14: Report to User

Final output structure:

```
✓ Captured workflow: workflows/<name>.yml
✓ Validated: passed
✓ Env template: workflows/<name>.envrc.example (X vars, Y secrets)

What this workflow does:
1. ...
2. ...
3. ...

To replay:
  cp workflows/<name>.envrc.example workflows/<name>.envrc
  # edit workflows/<name>.envrc to fill in secrets
  source workflows/<name>.envrc && orchstep run <name>

Reminder: add `.envrc` to your .gitignore so secrets don't get committed.
```

## --raw Flag Behavior

When `--raw` is passed, skip Steps 6, 8, 9 (no variable extraction, no error handling additions, no module detection). Emit a faithful transcript: every captured shell command becomes a `func: shell` step, no retries added, no assertions added beyond what the user explicitly ran. Still emit the `.envrc.example` (replay still needs env vars). Useful for users who want to manually polish the workflow.

## Hard Anti-Patterns (Never Do)

- Capture every bash command (filter noise)
- Auto-execute the captured workflow (side-effect risk)
- Silently overwrite existing workflow files
- Capture actual secret values into `.envrc.example`
- Modify `.gitignore` automatically
- Suggest modules that don't exist in the registry
- Generate spec test files (out of scope; future skill)
- Add execution logging hooks (out of scope; future engine work)
- Rewrite shell commands to use `@orchstep` modules without user confirmation
- Use `func: task` (wrong syntax — task calling is `task: name` + `with:`)
- Wrap JS conditions in `{{ }}` (JS in `if:`/`retry.when`/`loop.until`/`assert` is bare, no template wrapper)

## When to Refuse

- Session has no substantive work (just Q&A) → refuse, suggest doing work first
- Scope is too broad (entire multi-day session) → ask user to narrow with description
- User in a directory with no write permission → report error, suggest `--out`

## Test Coverage

The skill is validated against 30 coverage cases in `tests/coverage-cases.md`. Mental walkthroughs of these cases must all produce correct outputs before shipping.
