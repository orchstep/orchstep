# Variable System Reference

## The Critical Rule

There are two different things called "variables" in OrchStep that must NOT be confused:

| YAML field | Scope | Example | Template access |
|---|---|---|---|
| `defaults:` (workflow top) | Per workflow file — NOT global | `defaults: { env: staging }` | `{{ vars.env }}` |
| `vars:` (inside a task) | Per task | `vars: { region: us-east }` | `{{ vars.region }}` |
| `vars:` (inside a step) | Per step | `vars: { debug: true }` | `{{ vars.debug }}` |
| `--var` (CLI runtime) | Entire execution | `--var env=prod` | `{{ vars.env }}` |
| `with:` (task call params) | Called task's vars | `with: { env: prod }` | `{{ vars.env }}` |

Templates ALWAYS use `{{ vars.X }}` regardless of scope. The runtime merges every scope into a single `vars` namespace at execution time.

## Precedence: Runtime > Step > Task > Definition

When the same key appears at multiple levels, the higher-precedence one wins:

```yaml
defaults:
  env: staging        # Lowest — definition default
  version: "1.0.0"

tasks:
  deploy:
    vars:
      env: dev        # Overrides defaults.env
    steps:
      - name: build
        vars:
          env: prod   # Overrides task's env (highest in-file)
        func: shell
        do: echo "{{ vars.env }}"  # "prod"
```

CLI `--var env=production` overrides everything: `'{{ ne vars.env "production" }}'` is false.

## Environment Variables

Set via `env:` on task or step (access via `{{ env.X }}`):

```yaml
tasks:
  deploy:
    env:
      DB_HOST: "db.example.com"
      DB_PORT: "5432"
    steps:
      - name: check
        func: shell
        do: echo "{{ env.DB_HOST }}:{{ env.DB_PORT }}"
```

Step-level `env:` overrides task-level `env:` for that step only:

```yaml
- name: override
  func: shell
  env:
    DB_HOST: "alternative.db"   # overrides task-level for this step
  do: echo "{{ env.DB_HOST }}"
```

### Scoped environment (env: / dotenv: unwind on return)

Environment scopes like variables. A called task's own `env:`/`dotenv:` load
when it runs (batteries included); a value the caller passes down **overrides**
the callee's own (inversion of control); and everything the callee added
**unwinds when it returns** — so a callee's environment does NOT leak into the
caller's later steps or sibling tasks.

```yaml
tasks:
  smoke_test:
    dotenv: [staging.env]        # its own batteries -> DATABASE_URL
    env: { TIMEOUT: "30s" }
    steps: [ { func: shell, do: 'run-smoke --db "$DATABASE_URL"' } ]
  main:
    steps:
      - { task: smoke_test }     # loads staging.env FOR the callee only
      - { task: deploy_prod }    # does NOT inherit staging DATABASE_URL (unwound)
```

Precedence (high→low): caller call-step `env:` > task `env:` > task `dotenv:` >
workflow `env:`/`dotenv:` > OS env.

### dotenv: files

`dotenv: [.env, "deploy_{{ vars.environment }}.env?"]` loads KEY=value files into
the OS env (`.envrc` = only `export KEY=value` lines). Paths are template-resolved;
a trailing `?` makes a missing file optional. Use `<required>` as an `env:` value to
require-don't-set (fail fast if missing). A stray `.env` is never auto-loaded —
loading is always from a declared file (a trust boundary). Project-wide dotenv can
be declared in `orchstep_config.yml` `dotenv:` (applied after `--env`).

## Environment Groups (Multi-Env)

```yaml
defaults:
  replicas: 1
  log_level: info

env_groups:
  nonprod:
    vars:
      replicas: 2
      log_level: debug

environments:
  dev:
    group: nonprod
    vars:
      db_host: dev-db
  production:
    group: prod       # prod group would be defined similarly
    vars:
      db_host: prod-db
```

Run with: `orchstep run --env dev`

Resolution order: Step > Task > Environment > Group > Defaults

External env files: instead of inline `env_groups:`/`environments:`, drop an
`environments/` directory beside the workflow (auto-discovered). Files layer
hierarchically by name — `defaults.yml` → `<group>.yml` → `<group>-<env>.yml` —
and values can be whole objects (`{{ vars.resources.cpu }}`), not just strings.
A module ships its own `environments/` to be run as a configured instance
(see modules.md → context modes).

## Variable Types

Variables are dynamically typed. Auto-detect behavior for stdin pipe data:
- JSON strings auto-parse into objects/arrays
- YAML strings auto-parse when they look like structured data
- Plain strings passed through

## Step Outputs

Steps declare named outputs extracted from their result:

```yaml
- name: build
  func: shell
  do: echo "IMAGE=myapp:v1.2.3"
  outputs:
    image: '{{ result.output | regexFind "IMAGE=(.+)" }}'
```

Later steps access: `{{ steps.build.image }}`, `{{ steps.build.status }}`.