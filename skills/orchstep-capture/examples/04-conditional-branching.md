# Example 04: Conditional Branching by Environment

## The Session

User in Claude Code:

> "Deploy to whichever env I pass — staging needs basic verification, production needs the full check suite."

Claude ran:

```bash
# Used staging this session
ENV=staging
./deploy.sh --env $ENV

# For staging: just basic check
curl -fsSL https://staging.example.com/health

# Comment from user: "but for production we'd also need the full smoke suite"
# So Claude prepared the prod path even though staging was the actual run:
# ./scripts/smoke-tests-full.sh --env production
```

User: "good — make sure the workflow handles both paths."

## The Captured YAML

`workflows/deploy_with_env_specific_verify.yml`:

```yaml
name: deploy_with_env_specific_verify
desc: "Deploy to env, run env-appropriate verification (basic for staging, full for prod) (captured 2026-04-23)"

defaults:
  env: staging                  # Default; override with --var env=production

tasks:
  main:
    desc: "Deploy and route to env-appropriate verification"
    steps:
      - name: deploy
        func: shell
        do: |
          ./deploy.sh --env {{ vars.env }}
        retry:
          max_attempts: 3
          interval: 5s
          backoff_rate: 2.0

      - name: env_specific_verify
        switch:
          value: '{{ vars.env }}'
          cases:
            - when: production
              task: verify_full
              with:
                env: "{{ vars.env }}"
            - when: [staging, dev, qa]
              task: verify_basic
              with:
                env: "{{ vars.env }}"
          default:
            - task: verify_basic
              with:
                env: "{{ vars.env }}"

  verify_basic:
    desc: "Basic health check"
    steps:
      - name: health
        func: http
        args:
          url: "https://{{ vars.env }}.example.com/health"
          method: GET
        retry:
          max_attempts: 5
          interval: 10s
        outputs:
          status: '{{ result.status_code }}'

      - name: assert_healthy
        func: assert
        args:
          condition: '{{ eq steps.health.status 200 }}'
          desc: "Goal: {{ vars.env }} health endpoint must return 200"

  verify_full:
    desc: "Full smoke test suite (production)"
    steps:
      - name: full_smoke
        func: shell
        do: |
          ./scripts/smoke-tests-full.sh --env {{ vars.env }}

      - name: assert_smoke_passed
        func: assert
        args:
          condition: '{{ eq steps.full_smoke.exit_code 0 }}'
          desc: "Goal: full smoke suite must pass for {{ vars.env }}"
```

`workflows/deploy_with_env_specific_verify.envrc.example`:

```bash
# No env vars or secrets detected.
```

## Design Rationale

**Why `switch` instead of `if/elif/else`:**
The user expressed env-driven routing. `switch` is more readable than nested `if/elif/else` when the dimension being branched on is a single value with multiple cases. Multi-value `when:` (`[staging, dev, qa]`) keeps related branches grouped.

**Why two sub-tasks (`verify_basic`, `verify_full`):**
The captured session showed two distinct verification flavors. Splitting into named tasks:
1. Makes the intent clear in the YAML
2. Allows `with:` parameter passing
3. Lets future captures call `verify_basic` from a different workflow

The original session "main" task stays focused on deploy + routing logic.

**Variable extraction:**
- `env=staging` is the only var. Everything else (URL pattern, script path) is fixed structure.

**Why no env vars/secrets:**
Captured session used no `$VAR_NAME` references. The `--env` flag value comes from the `vars.env` workflow variable, not env.

**Why the `default:` branch:**
Defensive — if user passes `--var env=somethingelse`, the workflow falls back to basic verification rather than failing silently.

**The "not-actually-run-during-session" problem:**
The user only ran the staging path during the session, but expressed intent to handle production. The skill captured BOTH paths because the user explicitly mentioned the production case ("for production we'd also need the full smoke suite"). The capture skill should respect explicit intent statements, even if the corresponding code wasn't actually executed.

**Module suggestion:** None — env-routing logic is too custom for any core module.

**Replay value:**
- `orchstep run deploy_with_env_specific_verify` — runs staging deploy + basic verify (uses the default)
- `orchstep run deploy_with_env_specific_verify --var env=production` — runs prod deploy + full smoke

One workflow, two replay shapes. Demonstrates conditional capture done right.
