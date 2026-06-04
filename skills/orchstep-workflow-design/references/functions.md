# Function Reference

## shell — Execute Commands

```yaml
- func: shell
  do: echo "Hello {{ vars.name }}"
  # or
  args:
    cmd: echo "Hello {{ vars.name }}"
```

- Uses `/bin/sh` (POSIX) by default
- Windows: set `type: "gosh"` for Go-native shell (no bash or WSL needed)
- Stdout captured as `result.output`
- Access step output: `{{ steps.step_name.output }}`
- Step status: `{{ steps.step_name.status }}`
- Env vars available via `{{ env.VAR_NAME }}`
- Timeout: `timeout: 60s` — kills step after duration

## assert — Validate Conditions

```yaml
- func: assert
  args:
    condition: '{{ eq steps.build.status "success" }}'
    desc: "Build must succeed"
```

- ALWAYS use `args: condition:` (never `do:`)
- Expression is a Go template; returns a boolean
- Common helpers: `eq`, `ne`, `lt`, `gt`, `and`, `or`, `not`, `contains`, `regexMatch`
- Template expressions in single quotes to avoid YAML escaping

## http — HTTP Requests

```yaml
- name: check_health
  func: http
  args:
    url: "https://{{ vars.env }}.example.com/health"
    method: GET
  retry:
    max_attempts: 3
    interval: 5s
```

```yaml
- name: notify
  func: http
  args:
    url: "https://hooks.slack.com/services/..."
    method: POST
    body:
      text: "Deploy complete"
    auth:
      type: bearer
      token: "{{ vars.api_token }}"
```

- Methods: GET, POST, PUT, DELETE
- Auth types: bearer, basic, API key
- Response: `result.status_code`, `result.data`, `result.headers`
- Supports dynamic URL construction with templates
- Batch requests supported via loop

## git — Git Operations

```yaml
- func: git
  do: clone URL DEST
- func: git
  do: checkout BRANCH
```

- Operations: clone, checkout, push, fetch, pull, tag, status
- Supports authenticated operations (SSH key, token)
- Used internally by module system for remote modules

## transform — JavaScript Data Transformation

```yaml
- name: transform_data
  func: transform
  do: |
    return {
      name: data.name,
      fullAddress: `${data.street}, ${data.city}`,
      score: data.historical.reduce((a,b) => a + b, 0) / data.historical.length
    };
```

- Runs JavaScript via Goja (Go JS VM)
- Access variables: `vars.X`, `steps.X.Y`, `env.X`
- Access stdin pipe: `stdin`
- Can modify variables and emit outputs
- Supports map_in/out for pre/post transforms

## render — Template Rendering

```yaml
- func: render
  args:
    template: "config/{{ vars.env }}/database.yml"
    data:
      host: "{{ vars.db_host }}"
      port: 5432
```

- Renders Go templates against provided data
- Useful for config file generation

## wait — Delay

```yaml
- func: wait
  args:
    duration: 30s
```

- Supports: milliseconds (500ms), seconds (30s), minutes (2m)

## prompt — User Interaction

```yaml
- name: env
  func: prompt
  args:
    message: "Target environment"
    type: select           # text / password / select / confirm / multiselect
    options: [dev, staging, production]
    default: dev

- name: confirm_deploy
  func: prompt
  args:
    message: "Deploy?"
    type: confirm
    default: false

- name: approve
  func: prompt
  args:
    message: "Enter approval code"
    type: password
```

- Non-interactive mode: when stdin is not a TTY, uses `default` value with no prompt
- Prompt responses available as `steps.step_name.value`
- Options for select/multiselect can be list of strings or list of `{label:, value:}` objects