# Demo 05: Incident Response Runbook

## What This Demonstrates

This workflow models a structured incident response process. When a production
service goes down, engineers often scramble through ad-hoc commands. This
runbook codifies the triage procedure into repeatable, auditable steps --
gathering metrics, correlating evidence, notifying the team, and producing a
report.

## OrchStep Concepts Covered

- **Multi-step data pipeline** -- Each step builds on outputs from previous
  steps, forming a chain of evidence
- **Output extraction across many steps** -- Demonstrates how `outputs:` and
  `steps.<name>.<field>` wire data through a long pipeline
- **Template expressions in shell commands** -- Variables and step outputs are
  interpolated directly into shell scripts
- **Definition variables (`defaults:`)** -- Parameterize the service, severity,
  and incident ID for reuse across different incidents
- **Task composition (`func: task`)** -- `main` delegates to `triage`

## Workflow Structure

```
main
  +-- triage
        |-- gather_system_info       Disk, memory, CPU snapshot
        |-- check_service_health     Health endpoint + dependencies
        |-- collect_recent_logs      Error log analysis
        |-- check_recent_deployments Correlate with recent changes
        |-- determine_cause          Root cause analysis
        |-- send_notification        Alert the on-call team
        +-- generate_report          Full incident summary
```

## Running

```bash
# With defaults (P1 incident for payment-service)
orchstep run

# Different service and severity
orchstep run --var service_name=order-service --var severity=p2

# Custom incident ID
orchstep run --var incident_id=INC-20260311-099
```

## Key Patterns

### Building an Evidence Chain

Each step extracts specific data points that downstream steps reference:

```
gather_system_info   --> memory_percent, cpu_load
check_service_health --> failed_dependency
collect_recent_logs  --> dominant_error
check_recent_deployments --> recent_deploy
                              |
                              v
                        determine_cause (correlates all of the above)
                              |
                              v
                        generate_report (presents everything)
```

### Structured Output Convention

Use `KEY=value` lines at the end of shell output for reliable extraction:

```yaml
do: |
  # ... human-readable output above ...
  echo "LIKELY_CAUSE=rabbitmq_upgrade_incompatibility"
  echo "RECOMMENDED_ACTION=rollback_rabbitmq_to_3.12.1"
outputs:
  likely_cause: '{{ result.output | regexFind "LIKELY_CAUSE=([a-z_]+)" }}'
  recommended_action: '{{ result.output | regexFind "RECOMMENDED_ACTION=([a-z_0-9.]+)" }}'
```

This pattern separates human-readable logs from machine-parseable data.

## Real-World Extensions

- Replace simulated commands with real SSH/kubectl/API calls
- Add a `mitigate` task that performs the recommended action (e.g., rollback)
- Integrate with PagerDuty or Opsgenie for escalation
- Store the report in a ticket system (Jira, Linear)
- Add a `postmortem` task that collects timeline data for review
