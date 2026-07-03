# Module Reference

## What Modules Are

Modules are reusable, versioned, Git-distributed OrchStep components. Each module defines its config schema, exports tasks, and declares dependencies with version constraints.

## Import a Module

```yaml
name: my-workflow

modules:
  - name: ci-cd
    version: "^1.2.0"
    source: "github.com/org/module"
    config:
      registry: "ghcr.io/myorg"
```

## Module Definition (in the module repo)

```yaml
# orchstep-module.yml
name: ci-cd
version: "1.2.0"
desc: "Standard CI/CD pipeline components"

config:
  registry:
    type: string
    required: true

exports:
  - deploy
  - test
  - lint

dependencies:
  - name: helm
    version: "~3.0"
```

## Using a Module

Call a module task with the dedicated `module:` + `task:` keys (a dotted
`task: ci-cd.deploy` is **not** valid):

```yaml
tasks:
  main:
    steps:
      - module: ci-cd         # the import alias
        task: deploy          # an exported task
        with:
          environment: production   # parameters -> the task's vars
```

## Context modes: library vs configured instance

A module call runs one of two ways, selected by two call-step keys:

- **`instance_profile: <name>`** — run the module as a self-contained
  **configured instance**: it loads its OWN bundled context (its
  `environments/<name>` vars + its `dotenv:` + its `env:`), resolved relative
  to the module. Template-resolved; `"@caller"` follows the caller's active
  `--env` name (so one `--env` fans a fleet out to each module's matching profile).
- **`isolate: true`** — clean-room: exclude the caller's context and overrides
  (`with:` / `env:` / import `config:`). The OS environment is always inherited.

They're independent — four modes:

| | `isolate: false` | `isolate: true` |
|---|---|---|
| no `instance_profile` | **Inherited** (default) — caller drives; module defaults fill gaps | **Sealed** — module's own baseline, isolated |
| `instance_profile: p` | **Configured** — profile `p`, caller can still override | **Pinned** — profile `p`, clean-room |

```yaml
steps:
  # Library call (Inherited, default) — caller drives.
  - { module: notifier, task: send, with: { message: "starting" } }
  # Configured instance — module loads its own prod profile + dotenv + env.
  - { module: billing, task: deploy, instance_profile: prod }
  # Monorepo fan-out — one --env drives each module's own same-named profile.
  - { module: billing, task: deploy, instance_profile: "@caller" }
```

The bundled context (`environments/`/`dotenv:`/`env:`) loads ONLY in a
non-Inherited mode, and is **scoped** — it unwinds when the module returns, so
two instances of one module in a run stay independent and nothing leaks into the
caller. Inherited calls are unchanged from earlier versions. A named
`instance_profile` the module doesn't declare fails fast.
Deep dive: https://orchstep.dev/modules/using

## Version Constraints

| Expression | Meaning |
|------------|---------|
| `^1.2.0` | Compatible with 1.x (≥1.2.0, <2.0.0) |
| `~1.2.0` | Compatible with 1.2.x (≥1.2.0, <1.3.0) |
| `>=1.2.0, <2.0.0` | Arbitrary range |
| `1.2.0` | Exact version |
| `latest` | Always pull the latest published version |

## Cache and Locking

```yaml
modules:
  - name: infra
    source: "github.com/org/infra-module"
    version: "~1.0"
```

Lockfile (`orchstep-module-lock.yml`) pins exact versions for reproducibility. Regenerate with `orchstep module lock`.

## Private Modules

Modules can be hosted on any Git remote that the runner has access to:

```yaml
modules:
  - name: internal
    source: "github.com/myorg/private-module"
    version: "^2.0"
    config:
      env: "{{ vars.env }}"
```

For Pro users, `@private/` scope routes to a private registry with license gating.

## Module Naming

- Module names are lowercase, hyphen-separated
- Exported tasks are referenced as `module_name.exported_task`
- Config is passed at import time and available as `{{ config.NAME }}`