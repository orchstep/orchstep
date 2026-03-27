---
name: orchstep-test-to-example
description: Convert internal OrchStep test specs into public-facing usage examples. Use after implementing a new feature with test cases, or when expanding the example library. Ensures examples show capabilities without exposing engine internals or test assertions.
---

# Test-to-Example Conversion

Convert internal test specs into public-facing examples that teach users and LLM agents how to use OrchStep features.

## When to Use

- After implementing a new feature with test specs
- After adding new test cases to existing specs
- When expanding the public example library
- During release preparation (ensure examples cover new features)

## The Rule

**Examples show USAGE, not TESTING.**

| Source (Test Spec) | Target (Public Example) |
|---|---|
| `assert exit_code == 0` | Remove — internal detail |
| `output_contains: "retry attempt 3"` | Remove — test assertion |
| `func: shell` with `do: echo "test"` | Rewrite with realistic scenario |
| `retry: { max_attempts: 3 }` | Keep — this IS the usage pattern |
| `vars: { test_var: "foo" }` | Rename to realistic variable names |

## Process

### Step 1: Identify the spec to convert

Read the test spec's `orchstep.yml` and `case.md` (if exists).
Do NOT read `test.yml` — that contains internal assertions.

Ask yourself:
- What FEATURE does this spec demonstrate?
- Would a user find this pattern useful?
- Does this capability already have a public example?

### Step 2: Determine the category

| Category | Directory | What Goes Here |
|----------|-----------|---------------|
| Execution Basics | examples/01-execution-basics/ | Shell commands, basic workflows |
| Variables | examples/02-variables/ | Scoping, precedence, dynamic vars |
| Step Outputs | examples/03-step-outputs/ | Output extraction, data flow |
| Control Flow | examples/04-control-flow/ | if/else, switch, task calling |
| Loops | examples/05-loops/ | Iteration, filtering, until |
| Error Handling | examples/06-error-handling/ | Retry, catch, timeout, on-error |
| HTTP | examples/07-http-integration/ | REST APIs, auth, batch requests |
| Git | examples/08-git-operations/ | Clone, checkout, push, fetch |
| Templates | examples/09-templates-expressions/ | Go templates, Sprig, JavaScript |
| Environment | examples/10-environment-management/ | Env vars, .env files, groups |
| Configuration | examples/11-configuration/ | Config defaults, task discovery |
| Assertions | examples/12-assertions/ | Condition validation |
| Modules | examples/13-modules/ | Module usage, config, nesting |
| Real-World | examples/14-real-world-patterns/ | Synthesized multi-feature patterns |
| Parallel Execution | examples/15-parallel-execution/ | Concurrent steps, fan-out/fan-in |

If the feature doesn't fit existing categories, create a new numbered category.

### Step 3: Write the example

Template:
```yaml
# Example: [Feature Name]
# Demonstrates: [one-line description of what this shows]
#
# Key concepts:
#   - [concept 1]
#   - [concept 2]
#
# Try:
#   orchstep run [task]
#   orchstep run [task] --var key=value

name: [descriptive-name]
desc: "[What this workflow does in real-world terms]"

defaults:
  # Use realistic variable names, not test_var or foo
  environment: staging
  version: "2.0.0"

tasks:
  [task-name]:
    desc: "[Real-world description]"
    steps:
      # Steps from the test spec, rewritten with:
      # - Realistic scenarios (deploy, monitor, release, etc.)
      # - Descriptive names and descriptions
      # - Comments explaining the pattern
      # - NO test assertions (remove assert steps that just verify test output)
      # - KEEP assert steps that demonstrate validation patterns users would use
```

### Step 4: Strip test internals

Remove or rewrite:
- [ ] Steps that only verify test infrastructure (e.g., "check mockcli works")
- [ ] Variable names like `test_var`, `foo`, `bar` -> use realistic names
- [ ] Assertions that check internal engine behavior
- [ ] References to `../../../bin/mockcli` or test paths
- [ ] Output matching patterns that verify specific test strings

Keep:
- [ ] The core YAML structure showing the feature
- [ ] Retry/error handling configuration (this IS the pattern)
- [ ] Variable scoping and output extraction (this IS the usage)
- [ ] Assert steps that demonstrate validation users would do

### Step 5: Add to README

Update `examples/README.md` with the new example in its category table.

### Step 6: Verify

```bash
# The example should be valid YAML
orchstep lint examples/[category]/[example].yml

# If the example uses only echo/shell commands, it should run:
cd examples/[category]
orchstep run [task]
```

## Checklist

For each new test spec converted:

- [ ] Read orchstep.yml from the test spec (NOT test.yml)
- [ ] Identify the demonstrated feature
- [ ] Determine the target category
- [ ] Write the example with realistic scenarios
- [ ] Strip all test internals
- [ ] Add comments explaining the pattern
- [ ] Add `# Try:` instructions
- [ ] Update examples/README.md
- [ ] Verify YAML is valid
- [ ] Commit to orchstep public repo

## Batch Conversion

When converting multiple specs at once:

1. List all specs that don't have corresponding examples yet
2. Group by category
3. Convert each group, creating one example per distinct feature
4. Some specs can be merged (e.g., basic retry + conditional retry -> one retry example)
5. Update README with all new examples at once

## Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| Copy test.yml assertions | Write user-facing validation patterns |
| Use test variable names | Use realistic domain names (deploy, service, env) |
| Reference internal paths | Use relative paths or realistic URLs |
| Include engine-specific checks | Show feature usage from user perspective |
| Create one example per test spec | Merge related specs into comprehensive examples |
| Expose test infrastructure details | Abstract behind realistic scenarios |
