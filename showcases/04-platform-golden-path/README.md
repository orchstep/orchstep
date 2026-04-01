# Showcase: Platform Engineering Golden Path

Scaffold a production-ready service from scratch — repo, CI pipeline, observability, and team notification — all in a single OrchStep workflow.

## What This Proves

- **Multi-module orchestration**: 5 independent leaf modules composed into a cohesive golden path
- **Platform standardization**: Every new service gets the same structure, CI, monitoring, and alerting
- **Output chaining across modules**: Repo URL from scaffold flows into Slack notification message
- **Tier-based configuration**: Service tier (`critical`, `standard`) drives monitoring and alerting intensity
- **Existing module reuse**: `health-check` and `slack-notify` are standard OrchStep modules, not showcase-specific

## Architecture

```
orchstep.yml (this file)
|
+-- demo-repo-scaffold ------------ Leaf: GitHub repo creation + project structure
+-- demo-ci-pipeline -------------- Leaf: CI/CD pipeline setup + quality checks
+-- demo-observability ------------ Leaf: Monitoring, alerts, dashboards
+-- health-check ------------------ Leaf: Post-setup verification (existing module)
+-- slack-notify ------------------ Leaf: Team notification (existing module)
```

## Variable Flow

```
vars.service_name ("order-service")
  -> repo config.repo_name -> used for repo creation
  -> ci task with.repo_name -> used for pipeline naming
  -> observability config.service_name -> used for monitoring target
  -> slack message interpolation

vars.tier ("critical")
  -> observability config.tier -> drives scrape interval, retention, replicas
  -> observability configure_alerts with.tier -> drives alert thresholds

output chaining:
  steps.create_repo.repo_url
    -> slack notification message
```

## Run

```bash
# Default: order-service, Go, critical tier
orchstep run

# Python service for the backend team
orchstep run --var service_name=payment-api --var language=python --var team=backend

# Standard tier service (less aggressive monitoring)
orchstep run --var tier=standard

# List all available tasks
orchstep list
```

## Customization

To use this as a template for real platform engineering:
1. Replace module sources with your own repo scaffold, CI, and observability modules
2. Add additional golden path steps (security scanning, documentation generation, etc.)
3. Use `env_groups` to vary CI and monitoring config per environment
