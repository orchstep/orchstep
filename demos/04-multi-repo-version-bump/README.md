# Demo 04: Multi-Repo Version Bump

## What This Demonstrates

This workflow automates the process of bumping a shared library version across
multiple downstream repositories. In real-world microservice architectures,
updating a common dependency often requires coordinated changes across many
repos -- a tedious and error-prone manual process.

## OrchStep Concepts Covered

- **Definition variables (`defaults:`)** -- Parameterize the library name,
  target version, and list of repositories
- **Shell loops** -- Iterate over a space-separated list inside a single step
- **Output extraction (`outputs:`)** -- Capture structured data (repo count,
  PR list) from shell output using `regexFind`
- **Step output references (`steps.<name>.<field>`)** -- Pass extracted data
  between steps for the summary report
- **Task composition (`func: task`)** -- The `main` task delegates to `bump`

## Workflow Structure

```
main
  +-- bump
        |-- list_repos          Show the plan and count repos
        |-- bump_versions       Simulate clone/update/commit/push/PR per repo
        +-- print_summary       Aggregate and display PR links
```

## Running

```bash
# With defaults
orchstep run

# Override variables
orchstep run --var new_version=3.0.0 --var library_name=core-sdk

# Target fewer repos
orchstep run --var repos="frontend-app backend-api"
```

## Key Patterns

### Iterating Over a List

Space-separated strings in `defaults:` can be looped with a standard shell
`for` loop:

```yaml
defaults:
  repos: "frontend-app backend-api data-pipeline"

# In a step:
do: |
  for repo in {{ vars.repos }}; do
    echo "Processing ${repo}"
  done
```

### Capturing Structured Output

Use a known prefix in shell output and extract with `regexFind`:

```yaml
do: |
  echo "REPO_COUNT=${COUNT}"
outputs:
  repo_count: '{{ result.output | regexFind "REPO_COUNT=([0-9]+)" }}'
```

The captured value is then available as `{{ steps.list_repos.repo_count }}`
in later steps.

## Real-World Extensions

- Replace echo commands with actual `git clone`, `sed`, and `gh pr create`
- Add a `verify` task that polls CI status on each PR
- Integrate with a dependency graph to determine merge order
- Add rollback steps if any repo's tests fail
