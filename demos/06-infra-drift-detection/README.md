# Demo 06: Infrastructure Drift Detection

## What This Demonstrates

Infrastructure drift occurs when the actual state of cloud resources diverges
from what is defined in Terraform (or similar IaC tools). This workflow
automates the detection, assessment, and alerting process -- turning a manual
`terraform plan` review into a structured, repeatable pipeline.

## OrchStep Concepts Covered

- **Assert steps (`func: assert`)** -- Validates that plan parsing succeeded
  before continuing the pipeline
- **Conditional logic in shell** -- Severity assessment uses if/elif/else
  based on extracted metrics
- **Output chaining across steps** -- Plan output flows through parse, assess,
  alert, and report steps
- **Definition variables (`defaults:`)** -- Parameterize environment and
  Terraform directory for multi-environment use
- **Task composition (`func: task`)** -- `main` delegates to `detect`

## Workflow Structure

```
main
  +-- detect
        |-- terraform_plan     Simulate terraform plan
        |-- verify_parse       Assert outputs were extracted
        |-- parse_drift        Count and categorize changes
        |-- assess_severity    Classify as ok/warning/critical
        |-- send_alert         Notify team if drift found
        +-- drift_report       Final summary report
```

## Running

```bash
# With defaults (production environment)
orchstep run

# Different environment
orchstep run --var environment=staging --var terraform_dir=/infra/terraform/staging
```

## Key Patterns

### Using Assert for Validation

The `verify_parse` step ensures plan output was correctly extracted before
the pipeline continues. If parsing fails, the workflow stops with a clear
error instead of producing garbage results:

```yaml
- name: verify_parse
  func: assert
  args:
    condition: '{{ and (ne steps.terraform_plan.additions "") (ne steps.terraform_plan.changes "") }}'
    desc: "Terraform plan output must be parsed into additions, changes, and deletions"
```

### Severity Classification

Shell arithmetic and conditionals determine severity from extracted numbers:

```yaml
do: |
  TOTAL={{ steps.parse_drift.total_drift }}
  DELETIONS={{ steps.parse_drift.has_deletions }}
  if [ "${TOTAL}" -eq 0 ]; then
    SEVERITY="ok"
  elif [ "${DELETIONS}" -gt 0 ]; then
    SEVERITY="critical"
  elif [ "${TOTAL}" -lt 3 ]; then
    SEVERITY="warning"
  else
    SEVERITY="critical"
  fi
  echo "DRIFT_SEVERITY=${SEVERITY}"
```

### Conditional Notifications

The alert step only sends a notification when drift is actually detected,
avoiding noise for clean scans:

```yaml
if [ "${SEVERITY}" = "ok" ]; then
  echo "No drift detected. Skipping notification."
  echo "ALERT_SENT=false"
else
  # ... send alert ...
  echo "ALERT_SENT=true"
fi
```

## Real-World Extensions

- Replace simulated plan with actual `terraform plan -detailed-exitcode`
- Parse real Terraform JSON output (`-json` flag) for precise change details
- Schedule as a cron job for continuous drift monitoring
- Add a `reconcile` task that optionally runs `terraform apply`
- Integrate with compliance tools to flag security-sensitive drift
- Store drift history for trend analysis
