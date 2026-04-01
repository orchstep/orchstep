# Showcase: Compliance-Gated Release Pipeline

Enforce security scanning, compliance reporting, and environment-scoped approval gates before releasing a service.

## What This Proves

- **Environment-scoped approval**: Approval gate only triggers when `target_env == "production"` — staging releases skip it
- **Governance as code**: Security scans, compliance reports, and approval gates are orchestrated steps, not manual checklists
- **Conditional step execution**: The `if` directive on the approval gate demonstrates runtime branching based on variables
- **Mixed module types**: Combines showcase-specific modules (`demo-security-scan`, `demo-approval-gate`) with existing OrchStep modules (`git-release`, `report-gen`, `slack-notify`)
- **Output chaining**: Scan results flow into the Slack notification message

## Architecture

```
orchstep.yml (this file)
|
+-- demo-security-scan ------------ Leaf: SAST + dependency scanning
+-- demo-approval-gate ------------ Leaf: Policy-enforced approval workflow
+-- report-gen -------------------- Leaf: Compliance report generation (existing module)
+-- git-release ------------------- Leaf: Git tag + release creation (existing module)
+-- slack-notify ------------------ Leaf: Team notification (existing module)
```

## Variable Flow

```
vars.target_env ("staging" | "production")
  -> if condition on approval_gate step
    -> "production": approval is required before release
    -> anything else: approval is skipped

vars.scan_path ("./src")
  -> security config.scan_path -> SAST and dependency scan target

vars.version ("2.1.0")
  -> release task with.version -> Git tag creation
  -> slack message interpolation

output chaining:
  steps.sast_scan.status + steps.dependency_scan.status
    -> slack notification message
```

## Run

```bash
# Default: staging release (no approval gate)
orchstep run

# Production release (triggers approval gate)
orchstep run --var target_env=production

# Override version and scan path
orchstep run --var version=3.0.0 --var scan_path=./lib

# List all available tasks
orchstep list
```

## Customization

To use this as a template for real compliance-gated releases:
1. Replace `demo-security-scan` with real SAST tools (Semgrep, Snyk, Trivy)
2. Replace `demo-approval-gate` with your approval system (Jira, PagerDuty, Slack approvals)
3. Add additional scan types (container image scanning, license compliance, etc.)
