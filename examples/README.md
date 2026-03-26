# OrchStep Examples

Practical examples organized by capability. Each example is a standalone workflow you can run.

## How to Run

```bash
cd examples/01-execution-basics
orchstep run            # Run default task (main)
orchstep run <task>     # Run a specific task
orchstep run --var key=value  # Override variables at runtime
```

## Categories

| # | Category | Examples | Key Concepts |
|---|----------|----------|--------------|
| 01 | [Execution Basics](01-execution-basics/) | 3 | Shell commands, do: shorthand, timeouts |
| 02 | [Variables](02-variables/) | 5 | Scoping, precedence, dynamic vars, task params, map_in/map_out |
| 03 | [Step Outputs](03-step-outputs/) | 3 | Output extraction, JSON auto-parsing, cross-step references |
| 04 | [Control Flow](04-control-flow/) | 4 | if/else, elif chains, switch/case, task file discovery |
| 05 | [Loops](05-loops/) | 4 | Iteration, filtering, task delegation, until break |

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
| [task-calling.yml](04-control-flow/task-calling.yml) | Auto-discovery of task files from `tasks/` directory |

## 05 - Loops

| File | What it shows |
|------|---------------|
| [basic-loop.yml](05-loops/basic-loop.yml) | Lists, counts, ranges, custom variable names, loop metadata |
| [loop-with-conditions.yml](05-loops/loop-with-conditions.yml) | Gate pattern (if before loop) vs filter pattern (if per iteration) |
| [loop-with-task-call.yml](05-loops/loop-with-task-call.yml) | Call tasks in a loop with per-iteration `with:` parameters |
| [loop-until.yml](05-loops/loop-until.yml) | Break conditions, polling/retry patterns, JavaScript until |

## Variable Precedence Quick Reference

```
Runtime (--var)         Highest priority
  |
Step vars
  |
Task vars
  |
Definition vars (defaults:)   Lowest priority
```

## Template Syntax Quick Reference

```yaml
# Access variables
{{ vars.my_variable }}

# Access step outputs
{{ steps.step_name.output_key }}

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
```
