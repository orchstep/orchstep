# OrchStep Examples

Practical examples organized by capability. Each example is a standalone workflow you can run.

## How to Run

```bash
cd examples/01-execution-basics
orchstep run            # Run default task (main)
orchstep run <task>     # Run a specific task
orchstep run --var key=value  # Override variables at runtime
orchstep list           # List all available tasks
```

## Categories

| # | Category | Examples | Key Concepts |
|---|----------|----------|--------------|
| 01 | [Execution Basics](01-execution-basics/) | 3 | Shell commands, do: shorthand, timeouts |
| 02 | [Variables](02-variables/) | 5 | Scoping, precedence, dynamic vars, task params, map_in/map_out |
| 03 | [Step Outputs](03-step-outputs/) | 3 | Output extraction, JSON auto-parsing, cross-step references |
| 04 | [Control Flow](04-control-flow/) | 4 | if/else, elif chains, switch/case, task calling |
| 05 | [Loops](05-loops/) | 4 | Iteration, filtering, task delegation, until break |
| 06 | [Error Handling](06-error-handling/) | 6 | Retry, catch/finally, timeouts, on-error modes |
| 07 | [HTTP Integration](07-http-integration/) | 5 | GET/POST, auth, batch requests, response parsing |
| 08 | [Git Operations](08-git-operations/) | 4 | Clone, checkout, repo info, authenticated git |
| 09 | [Templates & Expressions](09-templates-expressions/) | 4 | Go templates, Sprig, JavaScript, template files |
| 10 | [Environment Management](10-environment-management/) | 4 | Env vars, scoping, groups, .env file loading |
| 11 | [Configuration](11-configuration/) | 3 | Config defaults, inline config, task discovery |
| 12 | [Assertions](12-assertions/) | 3 | Conditions, multi-assert, helper functions |
| 13 | [Modules](13-modules/) | 6 | Reusable components, config, overrides, nesting |
| 14 | [Real-World Patterns](14-real-world-patterns/) | 4 | Deploy pipeline, promotion, incident response, releases |
| 15 | [Parallel Execution](15-parallel-execution/) | 2 | Concurrent steps, fan-out/fan-in, parallel health checks |

---

## 01 - Execution Basics

| File | What it shows |
|------|---------------|
| [hello-world.yml](01-execution-basics/hello-world.yml) | Simplest possible workflow -- one task, one step |
| [shell-commands.yml](01-execution-basics/shell-commands.yml) | `do:` shorthand vs `args: cmd:`, multi-line scripts, capturing output |
| [shell-with-timeout.yml](01-execution-basics/shell-with-timeout.yml) | Passing timeout and other parameters to shell commands |

## 02 - Variables

| File | What it shows |
|------|---------------|
| [variable-scoping.yml](02-variables/variable-scoping.yml) | 3-level hierarchy: definition > task > step (+ runtime override) |
| [variable-precedence.yml](02-variables/variable-precedence.yml) | Full precedence rules, template expressions in vars, scope isolation |
| [dynamic-variables.yml](02-variables/dynamic-variables.yml) | Step outputs as dynamic variables, chaining outputs across steps |
| [vars-between-tasks.yml](02-variables/vars-between-tasks.yml) | Reusable tasks with `with:` parameters, task composition |
| [structured-data.yml](02-variables/structured-data.yml) | `map_in` / `map_out` JavaScript transforms, `utils` helpers |

## 03 - Step Outputs

| File | What it shows |
|------|---------------|
| [output-extraction.yml](03-step-outputs/output-extraction.yml) | Extract values from shell output with regex and templates |
| [auto-parse-json.yml](03-step-outputs/auto-parse-json.yml) | Automatic JSON/YAML detection via `result.data_object` |
| [cross-step-references.yml](03-step-outputs/cross-step-references.yml) | Outputs from conditional branches, nested step scoping |

## 04 - Control Flow

| File | What it shows |
|------|---------------|
| [if-else-basic.yml](04-control-flow/if-else-basic.yml) | Basic if/else with Go template and JavaScript conditions |
| [if-elif-else.yml](04-control-flow/if-elif-else.yml) | Multi-branch decisions with elif chains |
| [switch-case.yml](04-control-flow/switch-case.yml) | Pattern matching with switch/case, multi-value when, default |
| [task-calling.yml](04-control-flow/task-calling.yml) | Calling tasks from steps |

## 05 - Loops

| File | What it shows |
|------|---------------|
| [basic-loop.yml](05-loops/basic-loop.yml) | Lists, counts, ranges, custom variable names, loop metadata |
| [loop-with-conditions.yml](05-loops/loop-with-conditions.yml) | Gate pattern (if before loop) vs filter pattern (if per iteration) |
| [loop-with-task-call.yml](05-loops/loop-with-task-call.yml) | Call tasks in a loop with per-iteration `with:` parameters |
| [loop-until.yml](05-loops/loop-until.yml) | Break conditions, polling/retry patterns, JavaScript until |

## 06 - Error Handling

| File | What it shows |
|------|---------------|
| [basic-retry.yml](06-error-handling/basic-retry.yml) | Automatic retry on failure with max attempts and delay |
| [conditional-retry.yml](06-error-handling/conditional-retry.yml) | Retry based on error type or condition |
| [retry-with-jitter.yml](06-error-handling/retry-with-jitter.yml) | Retry with jitter to avoid thundering herd |
| [try-catch-finally.yml](06-error-handling/try-catch-finally.yml) | Try/catch/finally error handling pattern |
| [timeout-management.yml](06-error-handling/timeout-management.yml) | Step-level and total timeouts |
| [on-error-modes.yml](06-error-handling/on-error-modes.yml) | Continue, stop, or ignore on error |

## 07 - HTTP Integration

| File | What it shows |
|------|---------------|
| [basic-get-request.yml](07-http-integration/basic-get-request.yml) | Simple GET request |
| [rest-api-methods.yml](07-http-integration/rest-api-methods.yml) | POST, PUT, DELETE operations |
| [authentication.yml](07-http-integration/authentication.yml) | Bearer tokens, basic auth, API keys |
| [batch-requests.yml](07-http-integration/batch-requests.yml) | Multiple requests in sequence |
| [advanced-patterns.yml](07-http-integration/advanced-patterns.yml) | Headers, error handling, response parsing |

## 08 - Git Operations

| File | What it shows |
|------|---------------|
| [clone-patterns.yml](08-git-operations/clone-patterns.yml) | Clone repositories with various options |
| [checkout-operations.yml](08-git-operations/checkout-operations.yml) | Branch and tag checkout |
| [repository-info.yml](08-git-operations/repository-info.yml) | Read repo status and metadata |
| [authenticated-git.yml](08-git-operations/authenticated-git.yml) | Git operations with authentication |

## 09 - Templates & Expressions

| File | What it shows |
|------|---------------|
| [go-templates.yml](09-templates-expressions/go-templates.yml) | Go template syntax and Sprig functions |
| [dual-syntax.yml](09-templates-expressions/dual-syntax.yml) | Go templates vs JavaScript expressions side by side |
| [data-transform.yml](09-templates-expressions/data-transform.yml) | Transform data with template functions |
| [template-files.yml](09-templates-expressions/template-files.yml) | Include external template files |

## 10 - Environment Management

| File | What it shows |
|------|---------------|
| [env-var-basics.yml](10-environment-management/env-var-basics.yml) | Set, save, load, and mask env vars with security policies |
| [env-between-steps.yml](10-environment-management/env-between-steps.yml) | Env var scoping: step overrides task, scope isolation |
| [env-groups.yml](10-environment-management/env-groups.yml) | Multi-environment config with groups (dev/staging/prod) |
| [env-file-loading.yml](10-environment-management/env-file-loading.yml) | Load from .env and .envrc files, hierarchical config |

## 11 - Configuration

| File | What it shows |
|------|---------------|
| [config-defaults.yml](11-configuration/config-defaults.yml) | Override default function settings via config file |
| [inline-config.yml](11-configuration/inline-config.yml) | Embed config directly in orchstep.yml |
| [task-discovery.yml](11-configuration/task-discovery.yml) | Auto-discover tasks from `tasks/` directory |

## 12 - Assertions

| File | What it shows |
|------|---------------|
| [basic-assertions.yml](12-assertions/basic-assertions.yml) | Simple conditions with Go template and JavaScript syntax |
| [multi-conditions.yml](12-assertions/multi-conditions.yml) | Multiple conditions in a single assert step |
| [unified-patterns.yml](12-assertions/unified-patterns.yml) | Helper functions: `exists`, `len`, `contains`, `matches`, `get` |

## 13 - Modules

| File | What it shows |
|------|---------------|
| [basic-module.yml](13-modules/basic-module.yml) | Import and call a simple implicit module |
| [module-with-config.yml](13-modules/module-with-config.yml) | Configure a module at import time |
| [module-overrides.yml](13-modules/module-overrides.yml) | Override config per call with `with:` |
| [module-variable-scoping.yml](13-modules/module-variable-scoping.yml) | Scope isolation: consumer vs module variables |
| [self-contained-module.yml](13-modules/self-contained-module.yml) | Single-file module with metadata, schema, and exports |
| [nested-modules.yml](13-modules/nested-modules.yml) | Modules that import other modules (dependency chains) |

Module directory structure:
```
13-modules/
  modules/
    greeting/orchstep.yml       # Simple implicit module
    service/orchstep.yml        # Configurable module
    database/orchstep.yml       # Database operations module
    deploy.yml                  # Self-contained single-file module
    network/                    # Module with orchstep-module.yml metadata
      orchstep-module.yml
      orchstep.yml
    app-stack/                  # Module that imports database module
      orchstep-module.yml
      orchstep.yml
```

## 14 - Real-World Patterns

Production-ready workflows combining multiple features.

| File | What it shows |
|------|---------------|
| [deploy-pipeline.yml](14-real-world-patterns/deploy-pipeline.yml) | Build, deploy, health check with retry and assertions |
| [multi-env-promotion.yml](14-real-world-patterns/multi-env-promotion.yml) | Promote releases through dev/staging/prod with conditionals |
| [incident-response.yml](14-real-world-patterns/incident-response.yml) | Automated diagnostics, severity evaluation, and remediation |
| [release-automation.yml](14-real-world-patterns/release-automation.yml) | Version bump, changelog, multi-platform build, tag, and publish |

## 15 - Parallel Execution

Run steps concurrently to speed up workflows.

| File | What it shows |
|------|---------------|
| [parallel-build.yml](15-parallel-execution/parallel-build.yml) | Build frontend and backend in parallel, merge outputs for deploy |
| [parallel-health-checks.yml](15-parallel-execution/parallel-health-checks.yml) | Check multiple services simultaneously, assert all healthy |

---

## Variable Precedence Quick Reference

```
Runtime (--var)         Highest priority
  |
Step vars
  |
Task vars
  |
Environment vars        (from --env / env_groups)
  |
Definition vars (defaults:)   Lowest priority
```

## Template Syntax Quick Reference

```yaml
# Access variables
{{ vars.my_variable }}

# Access step outputs
{{ steps.step_name.output_key }}

# Access environment variables
{{ env.MY_ENV_VAR }}

# Loop variables
{{ loop.item }}          # Current item
{{ loop.index }}         # Zero-based index
{{ loop.index1 }}        # One-based index
{{ loop.first }}         # true on first iteration
{{ loop.last }}          # true on last iteration
{{ loop.length }}        # Total items

# Conditions (Go template)
{{ eq vars.env "prod" }}
{{ gt vars.score 90 }}
{{ and (eq vars.x "a") (ne vars.y "b") }}

# Conditions (JavaScript)
vars.score >= 90 && vars.score < 100

# Assertion helpers (JavaScript)
exists("steps.check.status")           # Value exists
len(vars.items)                        # Array/string length
contains(vars.tags, "critical")        # Array/string search
matches("^v\\d+", vars.version)        # Regex match
get("vars.config.db.host")             # Safe nested access
```
