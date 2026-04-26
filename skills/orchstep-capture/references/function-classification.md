# Function Classification

How to map an observed shell command in a Claude Code session to the correct OrchStep `func:` value.

## Classification Decision Tree

For each captured event, ask in order:

1. **Was it an HTTP request?** (curl, httpie, fetch, wget for an API)
   → `func: http` if structured (clear URL/method/headers); `func: shell` if it's a quick curl with output parsing
2. **Was it a verification / boolean check?** (test command, exit code check, comparison)
   → `func: assert`
3. **Was it data manipulation in JavaScript?** (transforming JSON, computing values)
   → `func: transform`
4. **Was it a template render to a file?**
   → `func: render`
5. **Was it a sleep / delay?**
   → `func: wait`
6. **Was it user input / decision?**
   → `func: prompt`
7. **Anything else** (git, kubectl, terraform, docker, npm, custom binaries, file ops)
   → `func: shell`

## Function-by-Function Mapping

### `func: shell` — the workhorse

**When:** Default for any command-line invocation. Git, kubectl, terraform, docker, aws, npm, bash scripts, file operations, custom CLIs.

**When NOT:** When the command is fundamentally an HTTP API call (use `http`), a sleep (use `wait`), a verification (use `assert`), or interactive (use `prompt`).

```yaml
- name: build
  func: shell
  do: |
    docker build -t app:{{ vars.version }} .
    docker push app:{{ vars.version }}
  outputs:
    image: 'app:{{ vars.version }}'
```

Optional args:
- `type: bash` (default) | `zsh` | `pwsh` | `gosh` (built-in cross-platform shell)
- `env:` map of additional env vars for this step
- `timeout: 30s`

### `func: http` — first-class HTTP

**When:** Calling an API where structured access to status/headers/body matters. Especially for health checks, webhooks, REST CRUD.

**When NOT:** Quick "did the page load?" check that doesn't need response parsing — `func: shell` with `curl -fsS` is fine.

```yaml
- name: health_check
  func: http
  args:
    url: "https://{{ vars.env }}.example.com/health"
    method: GET
    headers:
      Authorization: "Bearer {{ env.API_TOKEN }}"
    timeout: 10s
  outputs:
    status: '{{ result.status_code }}'
    body: '{{ result.data }}'
```

Auth shortcuts:
```yaml
auth:
  type: bearer
  token: "{{ env.API_TOKEN }}"
# OR
auth:
  type: basic
  username: "{{ env.USER }}"
  password: "{{ env.PASS }}"
```

### `func: assert` — verification

**When:** A step that ONLY checks a condition. Replaces ad-hoc `if [ X = Y ]; then exit 1; fi` shell snippets.

**When NOT:** When the verification is part of normal shell output — let the shell exit code handle it (`set -e`), or capture output and assert on it.

```yaml
- name: verify_deploy_healthy
  func: assert
  args:
    condition: '{{ eq steps.health_check.status_code 200 }}'
    desc: "Goal: deployment must return 200 after rollout"
```

### `func: transform` — JavaScript data shaping

**When:** Need to compute, filter, or reshape data between steps without spawning a process. JS runs in Goja sandbox (no filesystem, no network).

**When NOT:** For shell-pipeline transformations (jq, awk, sed) — just use `func: shell`.

```yaml
- name: parse_users
  func: transform
  do: |
    const data = JSON.parse(steps.fetch.output);
    return {
      active_count: data.users.filter(u => u.active).length,
      emails: data.users.map(u => u.email)
    };
  outputs:
    active_count: '{{ result.active_count }}'
    emails: '{{ result.emails }}'
```

### `func: render` — template to text/file

**When:** Generating a config file, a report, a deployment manifest from data.

**When NOT:** For variable substitution inline in commands — Go templates do that already in `do:` blocks.

```yaml
- name: generate_report
  func: render
  args:
    template: |
      # Deploy Report
      Version: {{ .version }}
      Status: {{ .status }}
    data:
      version: "{{ vars.version }}"
      status: "{{ steps.deploy.status }}"
    output: "/tmp/deploy-report.md"
```

### `func: wait` — pause

**When:** Rate limiting, backoff between independent calls (NOT inside a retry — retries handle that).

```yaml
- name: cool_down
  func: wait
  args:
    duration: 30s   # also accepts: 500ms, 2m, 1h
```

### `func: prompt` — interactive input

**When:** Workflows used by humans interactively. AUTOMATICALLY skips in non-interactive mode (CI, agents).

**When NOT:** In CI/CD-only workflows. In agent-only workflows. (Will be skipped, but adds noise.)

```yaml
- name: confirm_prod
  func: prompt
  args:
    message: "Deploy to production?"
    type: confirm
    default: false
```

Types: `text`, `password`, `select`, `confirm`, `multiselect`.

In non-interactive mode, the user can override via `--var prompt_name=value`.

## Special Case: Git

Git has no dedicated function. All git operations use `func: shell`.

```yaml
- name: tag_release
  func: shell
  do: |
    git tag -a "v{{ vars.version }}" -m "Release {{ vars.version }}"
    git push origin "v{{ vars.version }}"
```

For HTTPS auth, use env vars:
```yaml
- name: clone_private
  func: shell
  do: |
    git clone "https://x-access-token:{{ env.GITHUB_TOKEN }}@github.com/owner/repo.git"
```

## Anti-Patterns

- DON'T use `func: task` — task calling is `task: name` + `with:` (different mechanism)
- DON'T use `func: git` — doesn't exist; use `func: shell`
- DON'T use `func: http` for fire-and-forget curls — `func: shell` is fine
- DON'T add `func: assert` after every step — only for explicit goal verification
- DON'T use `func: transform` for things `jq` could do better in shell
