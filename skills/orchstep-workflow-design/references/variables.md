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