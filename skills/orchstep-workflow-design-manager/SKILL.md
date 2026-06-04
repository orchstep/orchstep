---
name: orchstep-workflow-design-manager
description: Update and maintain the orchstep-workflow-design skill. Use when a new OrchStep version is released, website docs change, or the workflow skill is missing features. Handles refreshing references, examples, wizard knowledge, and deep-dive URLs to keep the skill in sync with the engine.
---

# OrchStep Workflow Design Manager

This skill maintains `skills/orchstep-workflow-design/` — the workflow
authoring skill with references, examples, and a wizard. It ensures the
skill stays current with the OrchStep engine, website docs, and spec tests.

It does NOT regenerate everything from scratch. It detects gaps and fills
them surgically — only files that are genuinely stale get rewritten.

## Anatomy of the skill being maintained

```
skills/orchstep-workflow-design/
├── SKILL.md              — Router: Quick / Wizard / Deep Dive modes
├── wizard.md             — Intent dimensions for the explore-before-build path
├── references/           — 9 LLM-optimized knowledge files (synced from code)
├── examples/             — 4 annotated best-practice workflows (curated from spec tests)
```

## Source materials

The skill's knowledge comes from FOUR sources. The manager reads these
to detect what needs updating:

| Source | Location | What to look for |
|--------|----------|------------------|
| Website docs | `orchstep-website/src/content/docs/functions/*.md`, `spec/*.md`, `modules/*.md`, `examples/*.mdx` | New functions, changed args, new spec pages, new example patterns |
| Spec tests | `orchstep-core/tests/spec/NNNN-*/orchstep.yml` (private repo) | New features being tested — distill into references and examples |
| Code | `orchstep-core/pkg/workflow/loader.go`, `pkg/func/*.go` | Struct YAML tags reveal new fields, changed schema |
| Releases | `orchstep-pro` tags — `git tag --sort=-v:refname` | New version means new features the skill should teach |

## Workflow

### When to use this skill

- "Update the workflow skill for v0.7.0" — major trigger
- "The workflow skill doesn't mention X" — coverage gap
- "A new website page was published" — knowledge gap

### Step 1: Survey what changed

Collect the signal. Do NOT start editing yet — first answer: "what actually changed?"

```bash
# 1. What's the current skill file list?
find skills/orchstep-workflow-design/ -type f | sort

# 2. What website docs existed last time vs now?
# Read the website's current function pages:
ls orchstep-website/src/content/docs/functions/*.md
ls orchstep-website/src/content/docs/spec/*.md
ls orchstep-website/src/content/docs/modules/*.md

# 3. What new spec tests appeared since the last version?
#   Compare tags. If the user says "update for v0.7.0":
cd orchstep-core
git diff --name-only v0.6.1..HEAD -- tests/spec/

# 4. Did the engine schema change? Check loader.go for new yaml tags:
git diff v0.6.1..HEAD -- pkg/workflow/loader.go
```

### Step 2: Classify gaps

For each change detected, classify as:

| Type | Action | Target file |
|------|--------|-------------|
| New function or function arg | Update function signature + snippet | `references/functions.md` |
| New spec page / website example | Add annotated example | `examples/{NN}-{name}.yml` |
| New workflow field (struct tag) | Update syntax table | `references/syntax.md` |
| New error handling pattern | Update error handling guide | `references/error-handling.md` |
| New control flow feature | Update control flow doc | `references/control-flow.md` |
| Stale anti-pattern | Update anti-patterns | `references/anti-patterns.md` |
| New module feature | Update module reference | `references/modules.md` |
| New spec test teaching a pattern | Add/substitute an example | `examples/{NN}-{name}.yml` |
| Website has better explanation | Adopt wording into reference | whichever reference file |
| Website has new function page | Deep-dive URL already points there; verify path | `SKILL.md` deep-dive section |

### Step 3: Update reference files (surgical edits)

Do NOT rewrite reference files unless the change is pervasive. Prefer
adding a section or updating a table.

For small changes — add to the end of the relevant reference file with
a section header for the new content. For larger changes — identify the
old section and replace it.

Each reference file's frontmatter should reflect its source of truth:

```yaml
# references/syntax.md — sync checklist:
# - pkg/workflow/loader.go: WorkflowSpec/TaskSpec/StepSpec struct tags
# - Current version label if a feature was added
```

### Step 4: Update examples (only when a new pattern is demonstrated)

Add new example files to `examples/` when a spec test demonstrates a
pattern not covered by the existing 4. Each example must be:

- A valid OrchStep YAML workflow that could actually run
- Annotated with YAML comments explaining why each choice was made
- Self-contained (no external dependencies that aren't real services)

Name format: `{NN}-{short-description}.yml` where NN is the next number.

Before adding, check: "would a user who reads the existing 4 examples
also learn this pattern?" If yes, don't add.

### Step 5: Verify skill integrity

After edits, verify:

1. Every `references/*.md` is referenced from `SKILL.md`'s quick-mode table
2. Every deep-dive URL in `SKILL.md` returns HTTP 200
3. Every `examples/*.yml` has a brief header comment explaining its pattern
4. `wizard.md` output quality rules match `SKILL.md`'s rules
5. No placeholder text ("...", "TODO", "FIXME") in any skill file
6. The old skill directory (`orchstep-workflow-authoring/`) does not exist

### Step 6: Commit

```bash
cd orchstep
git add skills/orchstep-workflow-design/
# If renaming from authoring to design is done, also:
git rm skills/orchstep-workflow-authoring/SKILL.md 2>/dev/null
git commit -m "skill: update orchstep-workflow-design for vX.Y.Z

- references/syntax.md: added field X
- examples/05-cache-module.yml: new pattern for module caching
"
git push origin main
```

## Anti-patterns

- Do NOT regenerate reference files. Edit surgically. A reference file
  that was good for v0.6.0 is still 90% correct for v0.6.1 — don't
  rewrite the whole thing.
- Do NOT duplicate website pages. The references are LLM-optimized
  compressed knowledge, not full prose docs.
- Do NOT copy spec test YAML files verbatim. Distill the pattern and
  write an original example.
- Do NOT increase the number of reference files every time. Consolidate.
  9 reference files is the right size. Only add a new one if a genuine
  new domain appears (e.g., a new feature that doesn't fit any existing
  reference).