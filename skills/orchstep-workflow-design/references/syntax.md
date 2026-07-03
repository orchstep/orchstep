# Syntax Reference

## Top-Level Shape

```yaml
name: my-workflow
desc: What this workflow does

defaults:        # Workflow-level variables (NOT "vars:" at top level!)
  env: staging

config:          # Inline configuration (env_security, etc.)
env:             # Workflow-level OS env vars (templated; overrides dotenv)
dotenv:          # .env/.envrc files to load (template-resolved; trailing "?" = optional)
dir:             # Default working directory for shell commands

env_groups:      # Shared variable groups
environments:    # Per-environment variables

tasks:           # Task definitions (map — required)
steps:           # Top-level steps (alternative to tasks, mutually exclusive)

modules:         # Module imports
registries:      # Custom module registries
```

## Task Shape

```yaml
tasks:
  task_name:
    desc: Task description
    vars:       # Task-level variables
    env:        # Task-level env vars
    dotenv:     # Task-level dotenv files (loaded when the task runs; scoped)
    dir:        # Working directory for this task's shell commands
    steps:      # Task steps (required)
    catch:      # Error recovery
    finally:    # Always-run cleanup
```

`dir:` precedence is step > task > workflow > the workflow file's directory.
Relative paths resolve against the workflow file's dir; `~` is expanded.

## Step Shape

```yaml
- name: step_name          # Required — referenced as steps.step_name.field
  desc: Step description
  func: shell              # shell/http/git/assert/transform/render/wait/prompt
  do: echo "hello"         # Shortcut for primary parameter
  args:                    # Full function arguments
    cmd: echo hello
  task: other_task         # Call another task (mutually exclusive with func)
  module: mod_alias        # Call a module task (with task:) — see modules.md
  instance_profile: prod   # Module call: load the module's own profile (or "@caller")
  isolate: true            # Module call: clean-room (exclude caller context/overrides)
  vars:                    # Step-local variables
  with:                    # Parameters sent to called task
  env:                     # Step-local env vars
  dotenv:                  # Step-local dotenv files (scoped to this step)
  dir:                     # Working directory for this step's command
  outputs:                 # Output extraction
  loop: []                 # Loop configuration
  if:/then:/elif:/else:    # Conditional execution
  switch:/cases:           # Switch/case
  parallel: []             # Parallel child steps
  retry:                   # Retry config
  catch:/finally:          # Step-level error handling
  timeout:                 # Step timeout
  total_timeout:           # Total loop timeout
  on_error:                # fail/ignore/warn
  map_in:/map_out:         # JS pre/post transforms
  flags:                   # Execution flags
```

## Output Extraction

Uses Sprig `regexFind` on the step's stdout:

```yaml
- name: build
  func: shell
  do: echo "IMAGE=myapp:v1"
  outputs:
    image: '{{ result.output | regexFind "IMAGE=(.+)" }}'
```

Access in later steps: `{{ steps.build.image }}`, `{{ steps.build.status }}`, `{{ steps.build.result }}`.

## Task Calling (with parameters)

```yaml
- task: deploy
  with:
    environment: production
    replicas: 5

deploy:
  vars:
    environment: dev     # default
    replicas: 1
  steps:
    - func: shell
      do: echo "{{ vars.environment }} — {{ vars.replicas }} replicas"
```

`with:` sets task-level `vars:` in the called task. The caller can also pass `env:` for environment variable overrides.

## Important Rules

- Top-level variables use `defaults:`, not `vars:`. A top-level `vars:` is silently ignored.
- Task/step variables use `vars:`. Task call parameters use `with:`.
- Template references ALWAYS use `{{ vars.X }}` regardless of scope — runtime merges every scope into one `vars` namespace.
- For assertion steps, use `args: condition:`, not `do:`.
- `else:` with inline steps requires a `then:` wrapper.