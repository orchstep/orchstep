# Validation

How to validate the emitted workflow YAML and interpret errors.

## The Command

```bash
orchstep validate workflows/<name>.yml
```

This is a static check: syntax, structure, references. It does NOT execute the workflow.

Expected exit codes:
- `0` — valid, no errors
- non-zero — validation failed (errors printed to stderr)

For agent-friendly output:
```bash
orchstep validate workflows/<name>.yml --format json
```

JSON output includes structured error details (line numbers, error categories).

## Common Validation Errors and Fixes

### Error: missing required field
```
Error: step 'deploy': missing required field 'do'
```
**Fix:** Add the missing field. For shell steps, `do:` is required. For http, `args.url` and `args.method`. Re-emit with the field populated.

### Error: unknown function
```
Error: step 'verify': unknown func 'task'
```
**Cause:** Used `func: task` instead of `task: <name>`.
**Fix:** Replace with proper task syntax:
```yaml
# Wrong
- name: call_other
  func: task
  task: deploy

# Right
- name: call_other
  task: deploy
  with:
    env: staging
```

### Error: invalid reference
```
Error: step 'verify': references unknown step 'health_chek' (did you mean 'health_check'?)
```
**Fix:** Typo in `{{ steps.X.Y }}` reference. Match the exact step name.

### Error: invalid template
```
Error: step 'deploy': template parse error in 'do': unexpected }} at position 42
```
**Fix:** Mismatched `{{ }}` braces, or missing space between `{{` and the variable. Templates require a space: `{{ vars.env }}` not `{{vars.env}}`.

### Error: condition syntax
```
Error: step 'check': invalid condition syntax
```
**Cause:** Wrapped JS in `{{ }}` (JS conditions are bare).
**Fix:**
```yaml
# Wrong
if: '{{ vars.env === "production" }}'

# Right (JS)
if: 'vars.env === "production"'

# Right (Go template)
if: '{{ eq vars.env "production" }}'
```

### Error: duplicate step name
```
Error: task 'main': duplicate step name 'verify'
```
**Fix:** Step names must be unique within a task. Rename one (`verify_db`, `verify_api`).

### Error: circular task call
```
Error: task 'a' creates circular dependency via task 'b'
```
**Fix:** Restructure to flatten or break the cycle. OrchStep doesn't allow `a → b → a`.

## One Auto-Fix Pass

If validation fails, the skill SHOULD attempt one auto-fix pass before giving up:

1. Read the validation error
2. Identify the failing step / line
3. Determine if the error is one of the common patterns above
4. Apply the fix in-memory
5. Re-emit and re-validate

If the second validation also fails, write the YAML to disk anyway with a header comment:

```yaml
# CAPTURED WITH WARNINGS
# Validation error: <error message>
# Fix manually before running: orchstep run <name>
```

Then report the issue to the user clearly. Don't pretend success.

## Preview and Inspect Before Replay (optional tools)

Beyond static `validate`, these read-only tools help confirm the captured workflow behaves as intended — useful to mention to the user, or to self-check during the plain-English preview:

- **`orchstep run --dry-run <name>`** — plans the run without executing. Shows rendered commands, condition verdicts, and var provenance; secrets appear as `⟨secret:NAME⟩` (resolvers never run, so no credentials needed). Add `--open` for the visual plan.
- **`orchstep eval '<expr>'`** — evaluate a template or JS expression against the workflow's variable context (e.g. `orchstep eval '{{ vars.env }}'`). Uses the same `-f`/`--env`/`--var`/`--vars-file` flags a run would.
- **`orchstep eval --explain`** — show variable provenance: which precedence layer won for each var, and the OS env the workflow's `env:` sets (values masked). Great for "why is this var set to that?".
- **Breakpoints** — `flags: [breakpoint]` on a step, or `--break-before <step>` at run time, pauses before the step in an interactive read-only inspector. No-op in CI / non-TTY / `--dry-run`, so it never hangs an unattended run.

## Sanity Checks Beyond Static Validation

These are NOT done by `orchstep validate` but the skill should mentally check them:

- **At least one assert step exists** (or warn the user that the workflow has no success criteria)
- **All `{{ env.X }}` and `{{ secrets.X }}` references are documented in `.envrc.example`**, and every `{{ secrets.X }}` has a matching `secrets:` declaration (referencing an undeclared secret fails fast at run time)
- **All `{{ vars.X }}` references resolve** — i.e., `X` is defined in workflow-top-level `defaults:`, a task-level `vars:`, a step-level `vars:`, or passed via `--var` at runtime (all four scopes merge into the `vars` namespace)
- **Step names are descriptive** (not `step1`, `step2`)
- **Long shell scripts are readable** (heredoc or script file vs. one giant line)

These checks happen during the plain-English preview generation in Step 13 of the SKILL.md workflow.

## Anti-Patterns

- Skipping validation entirely (always run it)
- Auto-retrying validation more than once (fix the design or warn user)
- Hiding validation warnings (always report to user)
- Editing the YAML to make validation pass without checking semantic correctness
