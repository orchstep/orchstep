# Example 07: HTTP + Secrets (Critical — Shows Secret Handling)

## The Session

User in Claude Code:

> "Pull the active issues from our internal Jira, summarize, post the summary to Slack."

Claude ran:

```bash
# Fetch from Jira (with bearer token)
export JIRA_API_TOKEN="ATATT3xFfGF0_v3rys3cret_token_here_dont_share_xyzABC"
export SLACK_WEBHOOK="https://hooks.slack.com/services/T01XXXX/B01XXXX/abc123def456ghi789"

curl -H "Authorization: Bearer $JIRA_API_TOKEN" \
  "https://mycompany.atlassian.net/rest/api/3/search?jql=status%3DIn+Progress" \
  > /tmp/jira-issues.json

# Count and summarize
jq '.issues | length' /tmp/jira-issues.json
# 17

jq '.issues[] | "- \(.key): \(.fields.summary)"' /tmp/jira-issues.json | head -10 > /tmp/summary.txt
cat /tmp/summary.txt
# - PROJ-101: Fix login bug
# - PROJ-102: Update docs
# - ...

# Post to Slack
curl -X POST $SLACK_WEBHOOK \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"*17 issues in progress*\n$(cat /tmp/summary.txt)\"}"
```

User said "great — make this a daily workflow."

## The Captured YAML

`workflows/jira_to_slack_summary.yml`:

```yaml
name: jira_to_slack_summary
desc: "Fetch active Jira issues, summarize, post to Slack (captured 2026-04-23)"

defaults:
  jira_host: "mycompany.atlassian.net"
  jql: "status%3DIn+Progress"      # URL-encoded: status=In Progress
  summary_max_lines: 10

tasks:
  main:
    desc: "Daily Jira status summary to Slack"
    steps:
      - name: fetch_issues
        func: http
        args:
          url: "https://{{ vars.jira_host }}/rest/api/3/search?jql={{ vars.jql }}"
          method: GET
          headers:
            Authorization: "Bearer {{ env.JIRA_API_TOKEN }}"
            Accept: "application/json"
        retry:
          max_attempts: 3
          interval: 2s
          backoff_rate: 2.0
        outputs:
          issues_data: '{{ result.data }}'

      - name: summarize
        func: transform
        do: |
          const data = steps.fetch_issues.issues_data;
          const total = data.issues.length;
          const lines = data.issues.slice(0, vars.summary_max_lines).map(
            i => `- ${i.key}: ${i.fields.summary}`
          ).join("\n");
          return { total: total, summary_text: lines };
        outputs:
          total: '{{ result.total }}'
          summary_text: '{{ result.summary_text }}'

      - name: post_to_slack
        # Consider replacing with @orchstep/slack-notify module — cleaner config + retry built in
        func: http
        args:
          url: "{{ env.SLACK_WEBHOOK }}"
          method: POST
          headers:
            Content-Type: "application/json"
          body:
            text: "*{{ steps.summarize.total }} issues in progress*\n{{ steps.summarize.summary_text }}"
        retry:
          max_attempts: 3
          interval: 2s

      - name: assert_summary_posted
        func: assert
        args:
          condition: '{{ eq steps.post_to_slack.status_code 200 }}'
          desc: "Goal: Slack must accept the summary (status 200)"
```

`workflows/jira_to_slack_summary.envrc.example`:

```bash
# .envrc.example — env vars required to replay this workflow
# 1. Copy: cp jira_to_slack_summary.envrc.example jira_to_slack_summary.envrc
# 2. Fill: edit jira_to_slack_summary.envrc — replace placeholders
# 3. Source: source jira_to_slack_summary.envrc
# 4. Run: orchstep run jira_to_slack_summary
#
# IMPORTANT: Add `.envrc` to your .gitignore so secrets don't get committed.

# Secrets (placeholders only — fill in your own)
export JIRA_API_TOKEN="<your-jira-api-token>"
export SLACK_WEBHOOK="<your-slack-webhook-url>"
```

## Design Rationale

**THIS IS THE CRITICAL EXAMPLE — IT DEMONSTRATES SECRET HANDLING:**

The original session had two secrets in shell:
1. `JIRA_API_TOKEN="ATATT3xFfGF0_v3rys3cret_token_here_dont_share_xyzABC"` — Atlassian API token (real shape)
2. `SLACK_WEBHOOK="https://hooks.slack.com/services/T01XXXX/B01XXXX/abc123def456ghi789"` — webhook with embedded token

**Both detected as secrets:**

| Var | Detection trigger | Treatment |
|---|---|---|
| `JIRA_API_TOKEN` | Name pattern: contains "TOKEN" | Placeholder `<your-jira-api-token>`, NEVER actual value |
| `SLACK_WEBHOOK` | Value pattern: URL with long opaque path token | Placeholder `<your-slack-webhook-url>`, NEVER actual URL |

**The skill MUST NEVER write the actual token values into `.envrc.example`.**

**Function choices:**
- `fetch_issues` → `http`: structured response access via `outputs.issues_data` is needed for the next step
- `summarize` → `transform`: pure data shaping, no shell needed (no jq dance)
- `post_to_slack` → `http`: same — structured access to status code for the assertion

**Module suggestion (light):**
The Slack post matches `@orchstep/slack-notify`. Comment added above the step. The skill DOES NOT rewrite — that's `orchstep-harden`'s job.

**Variables extracted:**
- `jira_host` — domain extracted (parameterizable across instances)
- `jql` — query string (could be customized per workflow)
- `summary_max_lines` — tunable threshold

**Variable NOT extracted:**
- `mycompany` (subdomain) — captured as part of `jira_host` literal value, not split further (over-parameterization risk)

**The assertion:**
- Codifies the goal "summary must reach Slack" — verifies status_code 200 from the Slack API

**Why no `finally:`:**
Nothing to clean up. Stateless workflow.

**Why no `catch:` on the http calls:**
Retries handle transient failure. If the API is genuinely down, the workflow should fail loudly so the user knows the daily summary didn't go out.

**Replay value:**
- Daily cron: `orchstep run jira_to_slack_summary` (after `source .envrc`)
- Different filter: `--var jql=status%3DBlocked` to surface blocked issues instead
- Different team: `--var jira_host=otherteam.atlassian.net`

**Critical reminder shown to user:**
> Reminder: add `.envrc` to your .gitignore so secrets don't get committed.

The skill should explicitly check `.gitignore` and warn if `.envrc` is not listed (without modifying the file).
