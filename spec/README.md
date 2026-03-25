# OrchStep Language Specification

The OrchStep YAML workflow specification defines the format for `orchstep.yml` files.

## Function Reference

Detailed interface documentation for each built-in function:

| Function | Description |
|----------|-------------|
| [shell](functions/shell.md) | Shell command execution with streaming output, exit codes, and output extraction |
| [http](functions/http.md) | HTTP requests (GET/POST/PUT/DELETE) with auth, headers, and JSON response parsing |
| [git](functions/git.md) | Git operations (clone, checkout, push, fetch, list branches/tags, auth) |
| [assert](functions/assert.md) | Condition validation with Go templates, JavaScript, and aggregation helpers |
| [transform](functions/transform.md) | JavaScript-based data transformation in sandboxed Goja VM |
| [render](functions/render.md) | Template rendering for text and configuration generation |
| [wait](functions/wait.md) | Delays and timed pauses between operations |

## Workflow Features

| Document | Description |
|----------|-------------|
| [variables.md](variables.md) | Variable scoping, 4-level precedence, runtime overrides, vars files |
| [control-flow.md](control-flow.md) | if/elif/else, switch/case, loops, until conditions, task calling |
| [error-handling.md](error-handling.md) | try/catch/finally, retry with backoff and jitter, on-error modes, timeouts |
| [templates.md](templates.md) | Go template syntax, Sprig functions, JavaScript expressions, output extraction |

## Schema Files

- `cli-output-schemas/` -- JSON Schema for `--format json` output (coming soon)
- `workflow-schema.json` -- JSON Schema for workflow validation (coming soon)
- `module-schema.json` -- JSON Schema for module validation (coming soon)
