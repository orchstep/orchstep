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

Once imported, module tasks are callable like local tasks:

```yaml
tasks:
  main:
    steps:
      - task: ci-cd.deploy    # module-name.task-name
        with:
          environment: production
```

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