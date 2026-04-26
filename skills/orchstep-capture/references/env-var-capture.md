# Env Var and Secret Capture

How to detect env vars referenced in captured commands and generate the `.envrc.example` template safely.

## Detection Sources (in order of confidence)

1. **Explicit `$VAR_NAME` in shell commands** — strongest signal
2. **`${VAR_NAME}` references** — same as above
3. **`--token=$X` style flag values**
4. **Process env at session time** — only env vars actually referenced in commands

Do NOT include the entire `env` output. Only env vars that were USED.

## Secret Classification

An env var is treated as a **secret** if EITHER:

### A. Name pattern match (case-insensitive substring)
- TOKEN, KEY, SECRET, PASSWORD, PASS, CREDENTIAL, API_KEY, AUTH, CERT, PRIVATE, SIGNING

Examples that match:
- `GITHUB_TOKEN`, `AWS_SECRET_ACCESS_KEY`, `DB_PASSWORD`, `API_KEY`, `SERVICE_PRIVATE_KEY`, `JWT_SIGNING_SECRET`

### B. Value pattern match
- JWT format: `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`
- OpenAI keys: `sk-[A-Za-z0-9]{20,}`
- GitHub PATs: `ghp_[A-Za-z0-9]{36}`, `ghs_...`, `gho_...`
- AWS access keys: `AKIA[0-9A-Z]{16}`, `ASIA...`
- Long base64: ≥32 chars matching `^[A-Za-z0-9+/=]+$`
- Long hex: ≥32 chars matching `^[a-f0-9]+$`
- Bearer-shaped: starts with `Bearer ` followed by long opaque string

If EITHER A or B matches → secret. (Belt and suspenders.)

## Treatment Rules

### For secrets

- **Never** capture the actual value
- In `.envrc.example`: write a placeholder
- In the YAML: replace usage with `{{ env.VAR_NAME }}`

```bash
# .envrc.example
export GITHUB_TOKEN="<your-token-here>"
export DB_PASSWORD="<set-this>"
```

### For non-secrets

- Capture the actual value as the default
- In the YAML: still use `{{ env.VAR_NAME }}` for portability

```bash
# .envrc.example
export ENV="staging"
export AWS_REGION="us-east-1"
export LOG_LEVEL="info"
```

## .envrc.example File Format

```bash
# .envrc.example — env vars required to replay this workflow
# 1. Copy to .envrc:        cp <name>.envrc.example <name>.envrc
# 2. Fill in <placeholders> in .envrc
# 3. Source it:             source <name>.envrc
# 4. Run the workflow:      orchstep run <name>
#
# IMPORTANT: Add `.envrc` to your .gitignore so secrets don't get committed.

# --- Non-secrets (captured values) ---
export ENV="staging"
export AWS_REGION="us-east-1"

# --- Secrets (placeholders only — fill in your own) ---
export GITHUB_TOKEN="<your-token-here>"
export DB_PASSWORD="<set-this>"
```

## In the YAML — How Env Vars Appear

Replace direct env references with `{{ env.NAME }}`:

```yaml
# Captured
- name: clone
  func: shell
  do: git clone "https://x-access-token:{{ env.GITHUB_TOKEN }}@github.com/owner/repo.git"

- name: deploy
  func: shell
  do: |
    aws s3 sync ./build s3://my-bucket/{{ env.ENV }}/

- name: notify
  func: http
  args:
    url: "https://api.example.com/notify"
    headers:
      Authorization: "Bearer {{ env.NOTIFICATION_TOKEN }}"
```

## Edge Cases

### A var was used but might not be a real env var
**Example:** `$1` (shell positional arg), `$PWD` (built-in shell var), `$HOME`, `$PATH`
**Treatment:** Skip these. Built-in shell vars don't go in `.envrc.example`.

Built-ins to skip:
- `$1`, `$2`, `$@`, `$#`, `$?`, `$$`, `$!`
- `$HOME`, `$PWD`, `$OLDPWD`, `$PATH`, `$USER`, `$SHELL`, `$TERM`
- `$0`, `$PS1`, `$LANG`, `$LC_*`, `$EDITOR`

### Value looks like a secret but isn't
**Example:** A user-provided commit hash `1a2b3c4d5e6f...` (40 hex chars) is a hash, not a secret.
**Treatment:** When the var name has NO secret-pattern match AND the value is a known-shape (commit hash, UUID), prefer non-secret. When in doubt, treat as secret (safer).

### Var exists but value is empty in session
**Treatment:** Mark as secret with placeholder. User knows their setup.

### `.envrc` file already exists
**Treatment:** Do NOT touch the existing `.envrc`. Always emit `.envrc.example` next to it. The user merges manually if they want.

## Reminder for the User

Always include this reminder in the final output:

> Reminder: add `.envrc` to your .gitignore so secrets don't get committed.

Optionally check `.gitignore` and report whether `.envrc` is already listed. Do NOT modify `.gitignore` automatically.

## Anti-Patterns

- Capturing actual secret values (NEVER, even "by accident")
- Including built-in shell vars in `.envrc.example` (clutter)
- Including the user's full env (privacy + relevance)
- Putting secrets in the workflow YAML directly (always `{{ env.X }}`)
- Modifying `.gitignore` automatically (presumptuous)
- Using `{{ vars.X }}` for env vars instead of `{{ env.X }}` (wrong scope)
