# Module Detection (Light Touch)

When and how to suggest existing OrchStep modules in captured workflows. Suggestion only — never rewrite without user confirmation.

## Philosophy

The orchstep-capture skill produces shell-based workflows by default because:
- Shell is what the user actually ran
- Module rewriting is risky in v1 (false positives produce broken YAML)
- Heavy module integration is the job of the future `orchstep-harden` skill

So this skill only **suggests** known module matches via YAML comments. The user (or the `orchstep-harden` skill later) does the actual rewrite.

## The Official Module Registry (5 core utility modules)

Only suggest from these well-tested core modules. Demo modules (AWS, GCP, K8s composition) are too project-specific for v1.

### `@orchstep/slack-notify`
**What it does:** Send Slack notifications via webhook.
**When to suggest:** Captured session has a `curl` to `hooks.slack.com/...` posting JSON with `text` field.

Captured shape that triggers suggestion:
```bash
curl -X POST https://hooks.slack.com/services/.../.../... \
  -H "Content-Type: application/json" \
  -d '{"text": "Deploy complete"}'
```

Comment to add:
```yaml
- name: notify
  # Consider replacing with @orchstep/slack-notify module — cleaner config + retry built in
  func: shell
  do: |
    curl -X POST {{ env.SLACK_WEBHOOK }} \
      -H "Content-Type: application/json" \
      -d '{"text": "Deploy complete"}'
```

### `@orchstep/health-check`
**What it does:** HTTP endpoint health verification with retry and assert built-in.
**When to suggest:** Captured session has a sequence of `curl <url>/health` + assert + retry pattern.

Captured shape:
```bash
curl -fsSL https://staging.example.com/health
# (then user re-ran this 2-3 times until it succeeded)
```

Comment to add:
```yaml
- name: verify_health
  # Consider replacing with @orchstep/health-check module — handles retry + assert in one step
  func: http
  args:
    url: "https://{{ vars.env }}.example.com/health"
  retry: { max_attempts: 5, interval: 10s }
```

### `@orchstep/git-release`
**What it does:** Git tagging and release note generation.
**When to suggest:** Captured session has `git tag` + `git push origin <tag>` + something that generates release notes (changelog, gh release create).

Captured shape:
```bash
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3
gh release create v1.2.3 --notes "$(cat CHANGELOG.md | head -20)"
```

Comment to add:
```yaml
# Consider replacing this section with @orchstep/git-release module — handles tag, push, and release notes
```

### `@orchstep/report-gen`
**What it does:** Text and markdown report generation.
**When to suggest:** Captured session uses `cat <<EOF >` or echo redirect to build a structured report.

Captured shape:
```bash
cat <<EOF > /tmp/report.md
# Status Report
- Deployed: v1.2.3
- Tests: PASS
EOF
```

Comment to add:
```yaml
# Consider replacing with @orchstep/report-gen module — templated, structured output
```

### `@orchstep/env-check`
**What it does:** Development environment prerequisite validation.
**When to suggest:** Captured session starts with several `which X || echo "missing"` style checks.

Captured shape:
```bash
which docker || echo "missing docker"
which kubectl || echo "missing kubectl"
node --version
```

Comment to add:
```yaml
# Consider replacing with @orchstep/env-check module — declarative prerequisite checks
```

## Suggestion Rules

1. **High confidence only.** If the captured pattern is ambiguous, do NOT suggest. False positives are worse than missed suggestions.
2. **Comment, don't rewrite.** Add a `# Consider replacing with @orchstep/<module> module` comment above the relevant step(s).
3. **One module suggestion per workflow max.** Don't clutter the YAML with comments. Pick the highest-confidence match.
4. **Mention in user report.** When summarizing the captured workflow to the user, mention: "Detected 1 pattern that could use the @orchstep/slack-notify module. Run /orchstep-harden later to apply."

## Demo Modules (DO NOT suggest in v1)

These exist but are project-specific (AWS infra demos, K8s compositions, etc.):
- `@orchstep/demo-aws-*` (6 modules)
- `@orchstep/demo-k8s-*`, `@orchstep/demo-helm` (3 modules)
- `@orchstep/demo-gcp-*` (2 modules)
- `@orchstep/demo-machine-setup`, `@orchstep/demo-package-manager`, etc. (7 modules)

Why skipped: they're showcase modules, not utilities. Suggesting them in a generic capture would produce wrong recommendations for most users. The `orchstep-harden` skill (or a domain-specific `orchstep-aws-capture`) would be the right place for these.

## Anti-Patterns

- Suggesting a module without verifying it's in the official registry
- Suggesting demo/composition modules to general users
- Rewriting steps to use modules without user confirmation
- Adding more than one module suggestion per workflow (clutter)
- Suggesting modules in `--raw` mode (defeats the point of raw)
