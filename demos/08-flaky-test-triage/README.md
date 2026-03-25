# Demo 08: Flaky Test Triage Pipeline

## Pain Point

CI pipelines fail constantly due to flaky tests. Engineers waste time investigating failures that turn out to be known issues, leading to:

- **Alert fatigue** - Teams stop paying attention to CI failures because "it's probably flaky"
- **Missed real bugs** - Genuine failures get lost among the noise of flaky tests
- **Wasted CI compute** - Full re-runs when only a few tests are flaky
- **Slow merge velocity** - PRs sit in queues waiting for green builds

Manual triage is tedious: check the failure, search Jira for known issues, decide if it's real, trigger a re-run, and notify the right people. This takes 15-30 minutes per occurrence and happens multiple times per day.

## What This Demo Shows

OrchStep automates the entire triage decision tree:

- **Pattern matching** - A known flaky test database (backed by Jira tickets) automatically categorizes each failure
- **Data flow between steps** - Flaky counts, genuine counts, and rates propagate through the pipeline to inform decisions
- **Automated decision-making** - The pipeline decides the action (re-run, alert, or both) based on failure analysis
- **Structured reporting** - A final report aggregates all findings for human review

## Running the Demo

```bash
# Default project and run ID
orchstep run

# Specific CI run
orchstep run --var project_name=acme-web --var ci_run_id=run-50123
```

## Adapting for Production

1. **Connect to real CI** - Replace simulated fetch with API calls to GitHub Actions, Jenkins, or CircleCI
2. **Database-backed pattern list** - Store flaky patterns in a database or YAML file that teams can update via PR
3. **Historical analysis** - Add a step that queries failure history to auto-detect newly flaky tests (failed 3+ times in last week)
4. **Selective re-run** - Use CI API to trigger re-runs of only the flaky test subset, not the full suite
5. **Slack/Teams integration** - Send structured messages with failure details and one-click re-run buttons
6. **Metrics collection** - Track flaky rate over time, identify worst offenders, and generate weekly reports
7. **Auto-ticket creation** - If a test becomes flaky (fails intermittently 3+ times), auto-create a Jira ticket
