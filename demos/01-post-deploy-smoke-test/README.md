# Demo 01: Post-Deploy Smoke Test

## What It Does

Runs automated health checks against a deployed service's endpoints after a
deployment completes. The workflow hits three endpoints (health, API status,
metrics), asserts that each returned the expected status, and prints a
consolidated summary report.

## Pain Point It Solves

After every deployment, teams need to confirm the service is alive and its
dependencies (database, cache, message queue) are reachable. This is often a
manual `curl` check or a brittle shell script with no structured reporting.
OrchStep turns it into a declarative, self-documenting workflow with built-in
assertions and clear pass/fail output.

## Features Demonstrated

- **Definition variables** (`defaults:`) for configurable app name, environment,
  and endpoint paths.
- **Step outputs** to capture status codes and dependency states from simulated
  HTTP responses.
- **Assertions** (`func: assert`) to fail-fast if any endpoint is unhealthy.
- **Task delegation** -- `main` calls `smoke_test` as a reusable sub-task.
- **Summary reporting** using step output references across the pipeline.

## How to Run

```bash
orchstep run
```

Override the environment at runtime:

```bash
orchstep run --var environment=production --var deploy_version=3.5.0
```

## Adapting for Production

1. Replace the `echo`-based endpoint checks with real `curl` or `func: http`
   calls against your service URLs.
2. Add more endpoints or dependency checks as additional steps.
3. Wire the workflow into your CI/CD pipeline as a post-deploy gate -- if any
   assertion fails, the pipeline stops and the deployment can be rolled back.
4. Extend the summary step to post results to Slack or a monitoring dashboard.
