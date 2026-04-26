# Example 02: Data Fetch + Transform + Report

## The Session

User in Claude Code:

> "Fetch active users from our API, count them by region, write a report."

Claude ran:

```bash
# Fetch
curl -H "Authorization: Bearer $API_TOKEN" https://api.internal.example.com/v2/users?active=true > /tmp/users.json

# Transform (Claude wrote a quick node script)
cat <<'EOF' > /tmp/count.js
const data = JSON.parse(require('fs').readFileSync('/tmp/users.json'));
const byRegion = {};
data.users.forEach(u => byRegion[u.region] = (byRegion[u.region] || 0) + 1);
console.log(JSON.stringify(byRegion));
EOF
node /tmp/count.js > /tmp/counts.json
cat /tmp/counts.json
# {"us-east":420,"us-west":180,"eu-west":95,"ap-south":40}

# Report
cat <<EOF > /tmp/active-users-report.md
# Active Users by Region (2026-04-23)

| Region | Count |
|---|---|
| us-east | 420 |
| us-west | 180 |
| eu-west | 95 |
| ap-south | 40 |

Total: 735
EOF
```

User said "great, this is what I needed."

## The Captured YAML

`workflows/active_users_report.yml`:

```yaml
name: active_users_report
desc: "Fetch active users from internal API, count by region, write report (captured 2026-04-23)"

defaults:
  api_url: "https://api.internal.example.com"
  output_path: "/tmp/active-users-report.md"

tasks:
  main:
    desc: "Fetch, transform, report on active users"
    steps:
      - name: fetch_users
        func: http
        args:
          url: "{{ vars.api_url }}/v2/users?active=true"
          method: GET
          headers:
            Authorization: "Bearer {{ env.API_TOKEN }}"
        retry:
          max_attempts: 3
          interval: 2s
          backoff_rate: 2.0
        outputs:
          users: '{{ result.data }}'

      - name: count_by_region
        func: transform
        do: |
          const data = steps.fetch_users.users;
          const byRegion = {};
          data.users.forEach(u => byRegion[u.region] = (byRegion[u.region] || 0) + 1);
          const total = Object.values(byRegion).reduce((a, b) => a + b, 0);
          return { by_region: byRegion, total: total };
        outputs:
          by_region: '{{ result.by_region }}'
          total: '{{ result.total }}'

      - name: write_report
        func: render
        args:
          template: |
            # Active Users by Region ({{ .date }})

            | Region | Count |
            |---|---|
            {{- range $region, $count := .by_region }}
            | {{ $region }} | {{ $count }} |
            {{- end }}

            Total: {{ .total }}
          data:
            date: "{{ now | date \"2006-01-02\" }}"
            by_region: "{{ steps.count_by_region.by_region }}"
            total: "{{ steps.count_by_region.total }}"
          output: "{{ vars.output_path }}"

      - name: assert_users_found
        func: assert
        args:
          condition: '{{ gt (atoi steps.count_by_region.total) 0 }}'
          desc: "Goal: report must contain at least one user"
```

`workflows/active_users_report.envrc.example`:

```bash
# .envrc.example — env vars required to replay this workflow
# 1. Copy: cp active_users_report.envrc.example active_users_report.envrc
# 2. Fill: edit active_users_report.envrc
# 3. Source: source active_users_report.envrc
# 4. Run: orchstep run active_users_report
#
# IMPORTANT: Add `.envrc` to your .gitignore.

# Secrets (placeholders only)
export API_TOKEN="<your-bearer-token>"
```

## Design Rationale

**Function choices:**
- `fetch_users` → `http` (not shell+curl). Reason: structured response access via `outputs.users` is cleaner than parsing curl output.
- `count_by_region` → `transform` (not shell+node script). Reason: the JS logic is simple, runs in Goja sandbox, no /tmp file dance needed. This is a textbook `transform` use case.
- `write_report` → `render` (not shell+heredoc). Reason: templated structured output IS the use case for `render`.
- `assert_users_found` → `assert`. Reason: codifies "must have data" goal.

**Variables extracted:**
- `api_url` — base URL for portability (could become `vars.env`-aware later)
- `output_path` — user can override where the report goes

**Env vars:**
- `API_TOKEN` — name matches secret pattern (TOKEN), captured as secret with placeholder

**What got retries:**
- `fetch_users` — external API call (heuristic: HTTP to external service)
- Transform/render are deterministic, no retry needed

**What was NOT extracted:**
- The hardcoded counts (`420`, `180`) — those came from the actual API call output, not from input
- The date `2026-04-23` — replaced with `{{ now | date }}` so it auto-updates on replay

**Replay value:**
Running `orchstep run active_users_report` next month fetches CURRENT data and produces a CURRENT report. The captured workflow is parameterized correctly so the date and counts auto-update — it's not a snapshot, it's a procedure.

**Module suggestion:** None. The `report-gen` module COULD apply but the inline render is already clean. Mentioned to user as a possible harden-step optimization.
