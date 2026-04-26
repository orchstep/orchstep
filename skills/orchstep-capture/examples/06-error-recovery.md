# Example 06: Error Recovery with Rollback

## The Session

User in Claude Code:

> "Apply the new helm chart to staging. If the rollout fails, roll back and ping me on Slack."

Claude ran:

```bash
# Apply
helm upgrade myapp ./charts/myapp -n staging --set image.tag=2.0.0

# Wait for rollout
kubectl rollout status deployment/myapp -n staging
# FAILED — rollout exceeded progress deadline (CrashLoopBackOff)

# Rollback
helm rollback myapp -n staging
kubectl rollout status deployment/myapp -n staging
# OK after rollback

# Notify
curl -X POST $SLACK_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"text": "Helm upgrade of myapp v2.0.0 failed in staging — rolled back"}'
```

User said "ok let's make this a workflow that handles this automatically next time."

## The Captured YAML

`workflows/safe_helm_upgrade.yml`:

```yaml
name: safe_helm_upgrade
desc: "Helm upgrade with automatic rollback and Slack alert on failure (captured 2026-04-23)"

defaults:
  release: "myapp"
  chart_path: "./charts/myapp"
  namespace: "staging"
  image_tag: "2.0.0"

tasks:
  main:
    desc: "Upgrade with rollback safety net"
    steps:
      - name: upgrade
        func: shell
        do: |
          helm upgrade {{ vars.release }} {{ vars.chart_path }} \
            -n {{ vars.namespace }} \
            --set image.tag={{ vars.image_tag }}

      - name: wait_for_rollout
        func: shell
        do: |
          kubectl rollout status deployment/{{ vars.release }} -n {{ vars.namespace }} --timeout=5m
        timeout: 6m
        retry:
          max_attempts: 2
          interval: 30s
        catch:
          - name: rollback
            func: shell
            do: |
              helm rollback {{ vars.release }} -n {{ vars.namespace }}
              kubectl rollout status deployment/{{ vars.release }} -n {{ vars.namespace }} --timeout=2m
          - name: notify_slack
            func: http
            args:
              url: "{{ env.SLACK_WEBHOOK }}"
              method: POST
              headers:
                Content-Type: "application/json"
              body:
                text: "Helm upgrade of {{ vars.release }} v{{ vars.image_tag }} failed in {{ vars.namespace }} — rolled back"
            retry:
              max_attempts: 3
              interval: 2s

      - name: assert_app_healthy_after_run
        func: shell
        do: |
          kubectl get deployment {{ vars.release }} -n {{ vars.namespace }} -o jsonpath='{.status.readyReplicas}'
        outputs:
          ready: '{{ result.output | trim }}'

      - name: assert_replicas_ready
        func: assert
        args:
          condition: '{{ gt (atoi steps.assert_app_healthy_after_run.ready) 0 }}'
          desc: "Goal: at least one replica must be ready (either upgrade succeeded OR rollback succeeded)"
```

`workflows/safe_helm_upgrade.envrc.example`:

```bash
# .envrc.example — env vars required to replay this workflow

# Secret
export SLACK_WEBHOOK="<your-slack-webhook-url>"
```

## Design Rationale

**The catch + finally + on_error story:**

The captured session showed a clear "happy path" intent (upgrade succeeds) and a "fallback path" (rollback + notify). This maps cleanly to OrchStep's `catch:` block — runs ONLY when the step fails, after retries are exhausted.

Choices made:
- `catch:` includes BOTH the rollback AND the Slack notification — both should happen on failure
- No `finally:` — there's no cleanup needed regardless of outcome
- The final assertion checks "at least one replica ready" — this passes whether the upgrade succeeded OR the rollback succeeded. The workflow's GOAL is "leave the system in a healthy state," not "succeed at the upgrade."

**Why the assertion is tolerant:**
This is a key design call. The user wanted a workflow that gracefully handles failure. A strict "upgrade must succeed" assertion would FAIL THE WORKFLOW even though the rollback succeeded — defeating the whole point. The assertion codifies the actual goal: "system stays healthy."

**Why retry on `wait_for_rollout`:**
Sometimes the first rollout check times out due to slow init but eventually succeeds. Retrying once before triggering rollback prevents unnecessary rollbacks for slow-but-eventually-OK deployments.

**Why retry on `notify_slack`:**
Slack webhooks can be flaky (especially in incident scenarios — high traffic). 3 attempts with short intervals.

**Variables extracted:**
- `release`, `chart_path`, `namespace`, `image_tag` — every parameterizable knob
- The user can now reuse this workflow for ANY helm release with `--var release=otherapp`

**Env vars:**
- `SLACK_WEBHOOK` — captured as secret because it contains a token in the URL path. Both name pattern (no match) and value pattern (URL with long opaque token) trigger detection.

**Module suggestion (light):**
The Slack notification matches `@orchstep/slack-notify`. Skill adds a comment:
```yaml
- name: notify_slack
  # Consider replacing with @orchstep/slack-notify module — built-in retry + clean config
```

(Comment shown here in the rationale, would be in the actual emitted YAML.)

**Replay value:**
- `orchstep run safe_helm_upgrade --var image_tag=2.0.1` — try a new version
- If it fails again → automatic rollback + Slack ping
- If it succeeds → no rollback runs, workflow passes

This is the textbook "production-shaped capture": the failure mode IS the workflow's reason to exist.
