# 21 - Dry-Run Plans

Workflows built to be *planned* before they are run (`--dry-run`, v0.9.0+).
Both are fully runnable - every step is a harmless echo - so you can
compare the plan against a real execution.

## payments-deploy.yml

The docs tutorial workflow (https://orchstep.dev/learn/dry-run): a deploy
pipeline with a step-output dependency, a runtime-decided gate, a
variable-decided gate, a notify loop and a `finally:` block.

```bash
orchstep run deploy -f payments-deploy.yml --dry-run
orchstep run deploy -f payments-deploy.yml --dry-run --env production --var version=2.0.0
orchstep run deploy -f payments-deploy.yml --dry-run --open    # visual plan (PLAN/GRAPH tabs)
```

## release-orchestrator.yml

A four-task-layer release pipeline
(`release` -> `build_and_verify` -> `publish_artifacts` -> `_record_metrics`)
with a release-type switch, an if/elif/else rollout strategy, a
runtime-decided health gate, test/registry loop matrices, a parallel
announce fan-out, and task-level `catch:`/`finally:` rollback paths -
31 planned steps. Live rendered plan:
https://orchstep.dev/dryrun/example-complex-plan.html

```bash
orchstep run release -f release-orchestrator.yml --dry-run --env production
orchstep run release -f release-orchestrator.yml --env production              # real run (all echoes)
orchstep run release -f release-orchestrator.yml --var release_type=hotfix     # the fast path
```
