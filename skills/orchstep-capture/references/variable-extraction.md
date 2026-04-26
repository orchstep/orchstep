# Variable Extraction

Heuristics for identifying hardcoded values in captured commands that should become workflow variables.

> **Field name reminder:** workflow-top-level extracted variables go under `defaults:`, NOT `vars:`. The `vars:` field is only valid inside tasks/steps. Templates always reference them as `{{ vars.X }}` regardless of source — every scope merges into the runtime `vars` namespace.

## What to Extract (in priority order)

### 1. Environment names
**Pattern:** `staging`, `production`, `prod`, `dev`, `qa`, `test` appearing in commands, URLs, or flags.
**Extract as:** `defaults.env` (referenced as `{{ vars.env }}`)
**Default value:** the value seen in the captured session.

```bash
# Captured
kubectl --context=prod-cluster apply -f deploy-prod.yml
curl https://prod.api.example.com/health
```

```yaml
# Becomes
defaults:
  env: prod
steps:
  - func: shell
    do: kubectl --context={{ vars.env }}-cluster apply -f deploy-{{ vars.env }}.yml
  - func: http
    args:
      url: "https://{{ vars.env }}.api.example.com/health"
```

### 2. Version strings
**Pattern:** `1.2.3`, `v0.4.1`, `1.0.0-rc.1`, semver-shaped strings.
**Extract as:** `defaults.version` (referenced as `{{ vars.version }}`)
**When NOT to extract:** if the version came from a git tag command (`git describe`) — leave it dynamic.

```bash
# Captured
docker build -t app:1.2.3 .
docker push app:1.2.3
```

```yaml
defaults:
  version: "1.2.3"
steps:
  - func: shell
    do: |
      docker build -t app:{{ vars.version }} .
      docker push app:{{ vars.version }}
```

### 3. Hostnames and URLs (parameterizable parts)
**Pattern:** Subdomain that varies by env, or repeated hostname appearing 3+ times.
**Extract as:** `defaults.host` or split into `defaults.env` + base domain.

```bash
# Captured (host appears 3x)
curl https://api-prod.example.com/v1/users
curl https://api-prod.example.com/v1/orders
curl https://api-prod.example.com/v1/health
```

```yaml
defaults:
  api_host: api-prod.example.com
steps:
  - func: http
    args:
      url: "https://{{ vars.api_host }}/v1/users"
```

### 4. File paths with date or timestamp
**Pattern:** `backup-2026-04-23.tar.gz`, `logs/2026/04/23/...`
**Extract as:** `defaults.date` (capture as `2026-04-23` literal default; reference as `{{ vars.date }}`).

### 5. Repeated literals
**Rule of thumb:** If the same literal appears in 3+ commands, extract.

### 6. Numerical thresholds
**Pattern:** Replica counts (`--replicas=3`), timeouts (`--timeout=30s`), retry counts.
**Extract when:** They feel like a "tunable" rather than a fixed protocol value.

## What NOT to Extract

- **One-off values** (commit hash, transaction ID, ephemeral token) — capture literal, not a var
- **Protocol constants** (HTTP method names, status codes, port 80/443)
- **Standard paths** (`/etc/hosts`, `/usr/local/bin`)
- **Boolean flags** (`--dry-run`, `--verbose`) — these are fixed behavior, not vars
- **Things already in env vars** — those should be captured as env, not vars

## Variable Naming Conventions

- Use `snake_case`: `api_token`, `db_host` (referenced as `{{ vars.api_token }}`)
- Use semantic names, not positional: `staging_url` not `url1`
- Single-word for common: `env`, `version`, `host`, `region`, `cluster`
- Multi-word for specific: `target_env`, `source_repo`, `backup_bucket`

## Decision Heuristic

For each candidate value, ask:
1. **Will the user want to change this on a re-run?** If yes → extract.
2. **Does this value appear in 2+ steps?** If yes → extract (DRY principle).
3. **Does it look like a real-world dimension** (env, region, version)? If yes → extract.
4. **Is it likely to change between dev/staging/prod runs?** If yes → extract.

If none of the above, leave it as a literal in the YAML.

## Variable Defaults

Always set default values in the workflow-top-level `defaults:` section, derived from what was seen in the captured session:

```yaml
defaults:
  env: staging         # Captured value as default
  version: "1.2.3"     # Captured value as default
```

This way the workflow runs out-of-the-box with `orchstep run`. Users can override with `--var env=production`.

## Comments Marking Extracted Vars

Add a comment when extracting from a hardcoded value, so the user knows what changed:

```yaml
defaults:
  env: staging          # Extracted from session — was hardcoded "staging"
  version: "1.2.3"      # Extracted from session — was hardcoded "1.2.3"
```

## Anti-Patterns

- Extracting EVERY string into a var (over-parameterization makes YAML unreadable)
- Extracting things that should be env vars (passwords, tokens) — those go to `.envrc.example`
- Naming vars after their captured value (`vars.staging` instead of `vars.env`)
- Renaming captured values during extraction (keep the literal as the default)
