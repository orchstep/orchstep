# YAML Syntax Reference

Canonical OrchStep YAML structure. Loaded by orchstep-capture when emitting workflows.

## Top-Level Shape

```yaml
name: my-workflow                # required, identifier
desc: "What this workflow does"  # required, one-liner

defaults:                        # workflow-top-level variables (REQUIRED field name — `vars:` is INVALID at this level)
  env: staging
  version: "1.0.0"
  region: us-east-1

tasks:                           # required, at least one task
  main:                          # task name, must be unique
    desc: "..."
    vars:                        # optional task-level vars (this level IS `vars:`, not `defaults:`)
      timeout: 30s
    steps:                       # required, at least one step
      - name: step1              # required name (snake_case or kebab-case)
        func: shell              # required: shell|http|assert|transform|render|prompt|wait
        do: |
          echo "hello"
        outputs:                 # optional output extraction
          message: '{{ result.output }}'
```

## Available Functions (8 total)

| `func:` | Required Args | Common Optional | Purpose |
|---|---|---|---|
| `shell` | `do` | `type` (shell/bash/zsh/pwsh), `env`, `outputs`, `timeout` | Run shell commands |
| `http` | `args.url`, `args.method` | `args.headers`, `args.body`, `args.auth`, `outputs` | HTTP requests |
| `assert` | `args.condition` | `args.desc` | Validate condition (Go template OR JavaScript) |
| `transform` | `do` | `timeout` | JavaScript data transformation in Goja sandbox |
| `render` | `args.template` | `args.output`, `args.data` | Render Go/Sprig template |
| `prompt` | `args.message` | `args.type`, `args.default`, `args.options` | Interactive input (auto-skips in non-interactive mode) |
| `wait` | `args.duration` | — | Pause execution (e.g., `30s`, `5m`) |

**Important:** `git` is NOT a dedicated function. All git operations use `func: shell`.

## Task Calling (Not a Function)

```yaml
- name: call_other_task
  task: other_task              # NOT `func: task` — this is wrong
  with:                         # parameters passed as task vars
    environment: production
```

## Variable Reference Patterns

| Reference | Source |
|---|---|
| `{{ vars.x }}` | file/task/step vars (4-level precedence) |
| `{{ env.X }}` | environment variable (loaded from `.envrc` or shell) |
| `{{ steps.step_name.field }}` | output of a previous step |
| `{{ result.output }}` | current step's stdout |
| `{{ result.status_code }}` | http step status |
| `{{ result.exit_code }}` | shell step exit code |
| `{{ loop.item }}`, `{{ loop.index }}`, `{{ loop.first }}`, `{{ loop.last }}`, `{{ loop.length }}` | inside loops |

## Variable Precedence (highest to lowest)
1. Runtime: `--var key=value` or `--vars-file vars.yml`
2. Step-level `vars:`
3. Task-level `vars:`
4. Workflow-top-level `defaults:` (NOTE: this level uses `defaults:`, not `vars:` — all four scopes merge into the `vars` namespace at runtime, which is why templates always say `{{ vars.X }}`)

## Template Engines

- **Go templates** (default): `{{ }}` syntax with `eq`, `ne`, `gt`, `lt`, `and`, `or`, `not`
- **Sprig v3** (extensions to Go templates): `{{ upper .name }}`, `{{ regexFind "pattern" .input }}`, etc.
- **JavaScript** (in conditions only): `if:`, `retry.when`, `loop.until`, `assert.condition` accept BARE JS — no `{{ }}` wrapper

## Control Flow

### Conditional execution
```yaml
- name: conditional
  func: shell
  if: '{{ eq vars.env "production" }}'   # Go template
  do: echo "prod only"

# OR with JS (no wrapper)
- name: conditional
  func: shell
  if: 'vars.env === "production"'        # bare JS
  do: echo "prod only"
```

### If / elif / else
```yaml
- name: route
  if: '{{ eq vars.env "production" }}'
  then:
    - func: shell
      do: ./deploy-prod.sh
  elif:
    - if: '{{ eq vars.env "staging" }}'
      then:
        - func: shell
          do: ./deploy-staging.sh
  else:
    then:
      - func: shell
        do: ./deploy-dev.sh
```

### Switch / case
```yaml
- name: route
  switch:
    value: '{{ vars.env }}'
    cases:
      - when: production
        task: deploy_prod
      - when: [staging, dev]   # multi-value match
        task: deploy_test
    default:
      - task: deploy_local
```

### Loops
```yaml
# Items
- name: deploy_each
  loop: ['us-east-1', 'eu-west-1']
  func: shell
  do: ./deploy.sh --region {{ loop.item }}

# Count
- name: ping
  loop: { count: 5 }
  func: shell
  do: curl https://api/health

# Range
- name: indexed
  loop: { range: [0, 10, 2] }   # start, end, step
  func: shell
  do: echo {{ loop.item }}

# With config
- name: batch
  loop: ['a', 'b', 'c']
  as: name                       # custom item var: {{ name }} instead of {{ loop.item }}
  on_error: continue             # fail | continue | break
  collect_errors: true
  delay: 2s                      # between iterations
  until: '{{ eq result.output "DONE" }}'
  func: shell
  do: process {{ name }}
```

## Error Handling

```yaml
- name: risky
  func: shell
  do: kubectl apply -f deploy.yml
  timeout: 60s
  total_timeout: 5m              # includes all retries

  retry:
    max_attempts: 3
    interval: 2s                 # initial delay
    backoff_rate: 2.0            # exponential factor
    max_delay: 30s
    jitter: 0.3                  # 0.0-1.0 randomness
    when: 'result.exit_code !== 0'   # JS condition, optional

  catch:                         # runs after all retries exhausted
    - name: rollback
      func: shell
      do: kubectl rollback deployment/app

  finally:                       # always runs (success or catch failure)
    - name: cleanup
      func: shell
      do: rm -rf /tmp/artifacts

  on_error: fail                 # fail (default) | ignore | warn
```

Inside `catch`, error context is available:
- `vars.error.step_name` — name of the failed step
- `vars.error.exit_code`
- `vars.error.output`
- `vars.error.message`

## Output Extraction Patterns

```yaml
- name: build
  func: shell
  do: |
    echo "IMAGE_ID=abc123"
    echo "DIGEST=sha256:xyz"
  outputs:
    image_id: '{{ result.output | regexFind "IMAGE_ID=(.+)" }}'
    digest: '{{ result.output | regexFind "DIGEST=(.+)" }}'
```

Available regex helpers: `regexFind`, `regexFindAll`, `regexMatch`.

## Assert Function

```yaml
- name: verify
  func: assert
  args:
    condition: '{{ eq steps.health.status_code 200 }}'    # Go template
    desc: "Service must be healthy after deploy"

# OR with JS
- name: verify
  func: assert
  args:
    condition: 'steps.health.status_code === 200'         # bare JS
    desc: "Service must be healthy after deploy"
```

Aggregation helpers usable in assert:
- `all(steps.batch.outputs, "status_code", 200)` — every result matches
- `any(steps.batch.outputs, "status_code", 500)` — at least one matches
- `count(...)`, `sum(...)`, `avg(...)`, `pluck(...)` — aggregations

## Anti-Patterns

- DON'T use `func: task` — task calling is `task: name` + `with:` params
- DON'T wrap JS conditions in `{{ }}` — JS in if/retry.when/loop.until/assert is bare
- DON'T put secrets in YAML — use `{{ env.VAR }}` and capture in `.envrc.example`
- DON'T deeply nest tasks — max 2 levels, flatten with task delegation instead
- DON'T omit `desc:` on workflows or tasks — it documents intent for replay

## Source of Truth

This reference reflects orchstep engine state as of 2026-04-23. Source files:
- `orchstep/spec/` — language spec
- `orchstep/spec/functions/` — per-function docs
- `orchstep-core/tests/spec/` — 431 regression test specs (real usage patterns)
- `orchstep-website/src/content/` — public docs
