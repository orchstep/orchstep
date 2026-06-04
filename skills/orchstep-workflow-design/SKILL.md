---
name: orchstep-workflow-design
description: Design, write, and optimize OrchStep YAML workflows for CI/CD, operational automation, and AI agent orchestration. Use when the user wants to create a new workflow, improve an existing one, or learn the best way to model their process.
---

# OrchStep Workflow Design

You are designing workflows for OrchStep, a YAML-first workflow engine.
Your job is to produce production-quality orchestration code that handles
real-world failure modes, not just the happy path.

## Architecture

This skill has THREE layers, invoked automatically based on what the user
needs. You read the reference files directly (they ship with this skill).

```
references/       — Dense, LLM-optimized knowledge about every feature
examples/         — Annotated best-practice workflows
wizard.md         — Intent dimensions for the explore-before-build path
```

## Mode Selection

Read the user's request and decide which mode to use:

| Mode | When | What happens |
|------|------|-------------|
| **Quick** | User gives a concrete task name, clear steps, or a specific output they want. e.g. "Write a deploy pipeline," "I need a workflow that calls an API then deploys," "Build a CI chain" | Read relevant `references/*.md` file(s), produce the workflow directly. No questions. |
| **Wizard** | User says "help me design," "what's the best way," "show me options," or gives a vague requirement. | Read `wizard.md`, ask 2-4 intent questions, then produce the workflow. |
| **Deep dive** | User references a specific version, flag, or edge case. | Subagent: fetch real examples from `orchstep-website/src/content/docs/examples/` via public GitHub URL, or reference the examples/ directory. |

## Quick Mode Flow

1. Read the relevant reference file(s) from `references/*.md`:
   - Need the full YAML shape? → `references/syntax.md`
   - Need a specific function signature? → `references/functions.md`
   - Need variable handling? → `references/variables.md`
   - Need template expressions / Sprig functions? → `references/templates.md`
   - Need stdin/pipe data? → `references/stdin.md`
   - Need conditionals/loops/parallel? → `references/control-flow.md`
   - Need error handling/retry? → `references/error-handling.md`
   - Need modules? → `references/modules.md`
   - Need anti-patterns? → `references/anti-patterns.md`
2. Scan `examples/*.yml` for a pattern that matches — use it as a starting
   point, then adapt to the user's exact requirements.
3. Produce the complete workflow YAML with these guarantees:
   - Every step that can fail has appropriate error handling (retry,
     catch, finally, or on_error)
   - Every HTTP step has a timeout and retry
   - Every critical output has an assertion verifying it was produced
   - Every deploy/state-change step has a rollback path
   - Variables are extracted into `defaults:` — nothing hardcoded
4. Include a brief "why" comment for each structural choice.

## Wizard Mode Flow

1. Read `wizard.md` for the intent dimensions.
2. Ask questions one at a time, stopping when the intent is clear.
3. Read the relevant reference files.
4. Produce the workflow with a design rationale section explaining
   why each pattern was chosen. Reference the specific rule or
   anti-pattern that motivated each choice.

## Deep Dive Flow

For edge cases, complex module configurations, or version-specific
behavior, dispatch a subagent:

> Fetch a specific file from the public OrchStep website source:
> - Functions: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/functions/shell.md (same path for assert, git, http, prompt, render, transform, wait)
> - Spec docs: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/spec/templates.md
> - Variables: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/spec/variables.md
> - Control flow: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/spec/control-flow.md
> - Error handling: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/spec/error-handling.md
> - Shell execution: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/spec/shell-execution.md
> - Stdin/pipes: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/spec/stdin-pipe.md
> - Parallel: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/spec/parallel.md
> - Modules: https://raw.githubusercontent.com/orchstep/orchstep-website/main/src/content/docs/modules/overview.md

## Output Quality Rules

Every workflow you produce MUST satisfy EVERY applicable rule:

1. **Error handling exists.** Every deploy/API/build step has at least
   a `timeout`. HTTP steps have `retry`. Destructive steps have
   `catch:` with rollback.
2. **No hardcoded values.** Every repeatable value is extracted into
   `defaults:`, `vars:`, or `--var`.
3. **Assertions on critical outputs.** If step B consumes step A's
   output, there is an `assert` between them.
4. **`on_error` is explicit.** Non-critical steps (lint, audit,
   notifications) have `on_error: warn`.
5. **`finally:` for cleanup.** Temp files, services, or SSH tunnels
   are cleaned up.
6. **Task calls use `with:`** not `vars:` for passing parameters.
7. **Top-level variables use `defaults:`** not `vars:`.
8. **Templates use single quotes** for conditionals to avoid YAML
   escaping: `'{{ condition }}'`

## What NOT to do

- Do NOT generate placeholders or "..." — produce the complete workflow.
- Do NOT skip error handling for steps the user didn't ask for. Add it
  anyway — that's the value of this skill.
- Do NOT generate extra features the user didn't ask for. YAGNI.
  If the user wants a simple linear pipeline, give them a linear
  pipeline — not parallel branches.
- Do NOT treat `references/*.md` as "must read all every time." Read
  only the files relevant to the user's request. The skill is fast
  because it selectively reads, not because it crams everything into
  one prompt.