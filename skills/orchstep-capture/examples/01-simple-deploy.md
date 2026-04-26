# Example 01: Simple Deploy

## The Session

User in Claude Code:

> "Help me deploy v1.2.3 to staging and verify it's healthy."

Claude ran the following sequence:

```bash
# Build
docker build -t app:1.2.3 .

# Push
docker push myregistry.io/app:1.2.3

# Deploy
kubectl --context=staging set image deployment/app app=myregistry.io/app:1.2.3
kubectl --context=staging rollout status deployment/app

# Verify (re-ran twice waiting for readiness)
curl -fsSL https://staging.example.com/health
# (failed first time — got 503, waited, succeeded second time)
curl -fsSL https://staging.example.com/health
```

User said "looks good!" at the end. TodoWrite item "Deploy v1.2.3 to staging" was marked complete.

## The Captured YAML

`workflows/deploy_v1.yml`:

```yaml
name: deploy_v1
desc: "Deploy v1.2.3 to staging and verify health (captured 2026-04-23)"

defaults:
  env: staging                  # Extracted from session — was hardcoded "staging"
  version: "1.2.3"              # Extracted from session — was hardcoded "1.2.3"
  registry: "myregistry.io"     # Extracted — appeared in 2 places
  app: "app"
  base_url: "https://{{ vars.env }}.example.com"

tasks:
  main:
    desc: "Build, push, deploy, and verify health"
    steps:
      - name: build
        func: shell
        do: |
          docker build -t {{ vars.app }}:{{ vars.version }} .

      - name: push
        func: shell
        do: |
          docker push {{ vars.registry }}/{{ vars.app }}:{{ vars.version }}
        retry:
          max_attempts: 3
          interval: 5s
          backoff_rate: 2.0

      - name: deploy
        func: shell
        do: |
          kubectl --context={{ vars.env }} set image deployment/{{ vars.app }} {{ vars.app }}={{ vars.registry }}/{{ vars.app }}:{{ vars.version }}
          kubectl --context={{ vars.env }} rollout status deployment/{{ vars.app }}
        retry:
          max_attempts: 3
          interval: 5s
          backoff_rate: 2.0
        catch:
          - name: rollback
            func: shell
            do: kubectl --context={{ vars.env }} rollout undo deployment/{{ vars.app }}

      - name: verify_health
        func: http
        args:
          url: "{{ vars.base_url }}/health"
          method: GET
        retry:
          max_attempts: 5
          interval: 10s
        outputs:
          status: '{{ result.status_code }}'

      - name: assert_healthy
        func: assert
        args:
          condition: '{{ eq steps.verify_health.status 200 }}'
          desc: "Goal: deployment must be healthy after rollout"
```

`workflows/deploy_v1.envrc.example`:

```bash
# .envrc.example — env vars required to replay this workflow
# 1. Copy to .envrc:        cp deploy_v1.envrc.example deploy_v1.envrc
# 2. Fill in <placeholders> in .envrc
# 3. Source it:             source deploy_v1.envrc
# 4. Run the workflow:      orchstep run deploy_v1
#
# IMPORTANT: Add `.envrc` to your .gitignore so secrets don't get committed.

# This workflow had no detected env vars or secrets.
# (Optional) Add docker login here if your registry requires auth:
# export DOCKER_PASSWORD="<your-token-here>"
```

## Design Rationale

**What was extracted to `defaults:`:**
- `env=staging` — appears in 4 places, classic env name
- `version=1.2.3` — semver, appears in 3 places
- `registry=myregistry.io` — appears in 2 places, parameterizable
- `app` — default value, lets user reuse template for other apps
- `base_url` — composed from `env`, demonstrates var composition

**What got retries:**
- `docker push` — network call, registry rate limits (heuristic)
- `kubectl set image` + `rollout status` — k8s API can be eventually consistent (heuristic)
- `verify_health` — user themselves re-ran it during session (signal-driven)
- Build is NOT retried — local deterministic operation

**What got catch:**
- The `deploy` step gets a `rollback` catch because the user is hitting prod-shaped infra. This is added as a SAFETY net even though the user didn't perform a rollback in the captured session — it's a reasonable safety addition for kubectl-style steps.

**The assertion:**
- `assert_healthy` codifies the goal stated by the user ("verify it's healthy"). This is what makes the captured workflow a TEST: replaying it confirms not just "did it run" but "did it work."

**What was NOT extracted:**
- `docker`, `kubectl`, `curl` (binary names) — these are protocol/tool, not data
- `set image deployment/app app=` (kubectl syntax) — fixed structure
- `/health` (URL path) — semantic, not parameterizable
- `200` (HTTP status code) — protocol constant

**What was filtered out as noise:**
- The first failed `curl` attempt (503) — kept only the success, modeled with retry
- No `cd`, `ls`, `pwd` were captured (none were run, but they would have been skipped anyway)

**Module suggestion (light touch):**
None added. The `verify_health` pattern is close to `@orchstep/health-check` but the captured form is already idiomatic. Saving the suggestion for `orchstep-harden` prevents over-rewriting.

**Replay test:**
Once user fills in any optional env vars and runs `orchstep run deploy_v1`, the same sequence runs. The assertion at the end CONFIRMS success — not just "ran without error."
