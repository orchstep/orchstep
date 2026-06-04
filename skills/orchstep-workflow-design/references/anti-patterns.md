# Anti-Patterns

## DO NOT put secrets in YAML

```yaml
# BAD
args:
  token: "sk-live-abc123"

# GOOD — use env vars
args:
  token: "{{ env.API_TOKEN }}"
```

Secrets in YAML are committed to git, leaked in CI logs, and visible to anyone with repo access. Use `--var` from a secure vault, environment variables, or your CI's secret injection.

## DO NOT deeply nest task calls

```yaml
# BAD — 3+ levels of nesting
A → B → C → D (impossible to debug)

# GOOD — flatten to 2 levels max
A → B
A → C
A → D
```

Deep task chains create invisible control flow. Keep calls to 2 levels max. If you need more, use a linear pipeline or parallel execution.

## DO NOT skip assertions on critical outputs

If a build step's output is consumed by a deploy step, assert it:

```yaml
- name: verify_build
  func: assert
  args:
    condition: '{{ ne steps.build.image "" }}'
    desc: "Build must produce an image tag"
```

Assertions are the difference between a script that silently produces garbage downstream and one that fails fast with a clear message.

## DO NOT hardcode paths or values

```yaml
# BAD
do: |
  kubectl apply -f deployment.yml

# GOOD
do: |
  kubectl apply -f {{ vars.deployment_manifest }}
```

Variables make workflows reusable across environments, teams, and time. Any string that changes between runs is a candidate for `vars:`, `defaults:`, or `--var`.

## DO NOT leave `on_error` unspecified for non-critical steps

```yaml
# BAD — lint fails and blocks the deploy
- name: lint
  func: shell
  do: eslint .

# GOOD — lint failure is recorded but doesn't block
- name: lint
  func: shell
  do: eslint .
  on_error: warn
```

Every step's `on_error` default is `fail`. Be explicit about which steps are allowed to break. Use `warn` for lint, audit, notifications, and optional checks.

## DO NOT duplicate workflows across files

If you have similar workflows for different environments, use `env_groups` + `environments` instead of copy-pasting. Or extract shared logic into a module.

## DO NOT assume the workflow runs in a specific directory

Use absolute or configured paths, or `working-directory` references. The runner's CWD may not be what you expect.

## DO NOT skip timeout on potentially-hanging operations

HTTP calls, shell commands on remote hosts, and Docker operations can hang indefinitely if the remote is unreachable. Always set a timeout.

```yaml
- name: deploy
  func: shell
  do: helm upgrade --install myapp ./chart
  timeout: 120s
```