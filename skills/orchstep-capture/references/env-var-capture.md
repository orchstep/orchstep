# Env Var and Secret Capture

How to detect env vars referenced in captured commands, route secrets through the `secrets:` namespace, and generate a safe `.envrc.example` companion.

## Two namespaces — pick the right one

| | Non-secret OS env var | Secret / credential |
|---|---|---|
| Declared with | `env:` (optional) | `secrets:` (required to reference) |
| Referenced as | `{{ env.X }}` | `{{ secrets.X }}` |
| In logs/output | visible (unless name matches a mask pattern) | always `***` |
| In run history | stored | **excluded entirely** |
| Resolved | at load | lazily, once, on first reference |

**Rule:** if a captured var is a secret → emit a `secrets:` declaration and reference `{{ secrets.X }}`. If it is an ordinary config env var → keep `{{ env.X }}`.

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

### For secrets — route through `secrets:`

The capture skill does NOT know where the user keeps their secrets, so the safe default is to **promote the OS env var** the session already used. This is leak-safe: the value is masked everywhere and never enters the run history.

- In the YAML: declare a `secrets:` resolver and reference `{{ secrets.VAR_NAME }}`
- In `.envrc.example`: a placeholder documenting that the user must provide the var in their environment (NEVER the actual value)

```yaml
# In the workflow
secrets:
  GITHUB_TOKEN: { env: GITHUB_TOKEN }     # promote the existing OS env var
  DB_PASSWORD:  { env: DB_PASSWORD }
```

```yaml
# Used downstream, masked everywhere
- name: clone
  func: shell
  do: git clone "https://x-access-token:{{ secrets.GITHUB_TOKEN }}@github.com/owner/repo.git"
```

A power user can later swap the resolver to fetch directly from their tool without touching the env (`{ cmd: "op read op://prod/db/password" }`, `{ cmd: "vault kv get -field=token secret/api" }`, or `{ task: NAME, field: "..." }`). The capture skill stays with `{ env: VAR }` because it is the zero-config form that matches what the session actually did.

### For non-secrets — keep `{{ env.X }}`

- Capture the actual value as the documented default in `.envrc.example`
- In the YAML: use `{{ env.VAR_NAME }}` (optionally declare under `env:` for portability)

```yaml
# Optional explicit declaration
env:
  ENV: "{{ env.ENV }}"
  AWS_REGION: "{{ env.AWS_REGION }}"
```

## .envrc.example File Format

The `.envrc.example` still documents everything the user must provide before replay — secrets (as placeholders) AND non-secrets (as captured values). At run time, `secrets: { env: X }` promotes those env vars into the masked namespace.

```bash
# .envrc.example — env vars required to replay this workflow
# 1. Copy to .envrc:        cp <name>.envrc.example <name>.envrc
# 2. Fill in <placeholders> in .envrc
# 3. Source it:             source <name>.envrc
# 4. Run the workflow:      orchstep run <name>
#
# IMPORTANT: Add `.envrc` to your .gitignore so secrets don't get committed.

# --- Non-secrets (captured values, read as {{ env.X }}) ---
export ENV="staging"
export AWS_REGION="us-east-1"

# --- Secrets (placeholders only — promoted into secrets: as {{ secrets.X }}) ---
export GITHUB_TOKEN="<your-token-here>"
export DB_PASSWORD="<set-this>"
```

## In the YAML — How Vars Appear

```yaml
secrets:
  GITHUB_TOKEN: { env: GITHUB_TOKEN }
  NOTIFICATION_TOKEN: { env: NOTIFICATION_TOKEN }

tasks:
  main:
    steps:
      - name: clone
        func: shell
        do: git clone "https://x-access-token:{{ secrets.GITHUB_TOKEN }}@github.com/owner/repo.git"

      - name: deploy
        func: shell
        do: |
          aws s3 sync ./build s3://my-bucket/{{ env.ENV }}/      # non-secret env var

      - name: notify
        func: http
        args:
          url: "https://api.example.com/notify"
          headers:
            Authorization: "Bearer {{ secrets.NOTIFICATION_TOKEN }}"
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
**Treatment:** When the var name has NO secret-pattern match AND the value is a known-shape (commit hash, UUID), prefer non-secret (`{{ env.X }}`). When in doubt, treat as secret (route through `secrets:`).

### Var exists but value is empty in session
**Treatment:** Treat as secret, promote via `secrets: { env: X }`, with a placeholder in `.envrc.example`. User knows their setup.

### `.envrc` file already exists
**Treatment:** Do NOT touch the existing `.envrc`. Always emit `.envrc.example` next to it. The user merges manually if they want.

## Reminder for the User

Always include this reminder in the final output:

> Reminder: add `.envrc` to your .gitignore so secrets don't get committed.

Optionally check `.gitignore` and report whether `.envrc` is already listed. Do NOT modify `.gitignore` automatically.

## Anti-Patterns

- Capturing actual secret values (NEVER, even "by accident")
- Putting a secret in `{{ env.X }}` when it should be `{{ secrets.X }}` (env values can leak into output/history; secrets cannot)
- Hardcoding a secret value in a `secrets:` block — secrets are always references (`{ env: X }` / `{ cmd: ... }` / `{ task: ... }`), never literals
- Including built-in shell vars in `.envrc.example` (clutter)
- Including the user's full env (privacy + relevance)
- Modifying `.gitignore` automatically (presumptuous)
