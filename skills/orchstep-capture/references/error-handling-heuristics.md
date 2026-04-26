# Error Handling Heuristics

When to add `retry`, `catch`, `finally`, and `on_error` to captured steps.

## Rule of Thumb

A captured workflow should add error handling ONLY where the original session showed real risk of failure. Don't blanket-wrap everything in retries — that's noise.

Two questions for each step:
1. Did this command fail or behave flakily during the session? (saw transient errors, timeouts, eventual consistency)
2. Is this command commonly flaky in the wild? (network calls, deploys, eventual-consistency systems)

If yes to either → add retry. Otherwise leave it bare.

## Patterns That Warrant Retry

| Pattern | Reason | Suggested retry |
|---|---|---|
| HTTP health check / readiness probe | Eventual consistency after deploy | `max_attempts: 5, interval: 10s` |
| `kubectl apply` or `kubectl rollout status` | k8s API can be eventually consistent | `max_attempts: 3, interval: 5s, backoff_rate: 2.0` |
| `docker push` / `docker pull` | Network flakiness, registry rate limits | `max_attempts: 3, interval: 5s, backoff_rate: 2.0` |
| External API calls (`curl https://...`) | Network, rate limits, transient 5xx | `max_attempts: 3, interval: 2s, backoff_rate: 2.0, jitter: 0.3` |
| `terraform apply` | Cloud API throttling | `max_attempts: 3, interval: 30s, backoff_rate: 2.0` |
| `aws ...`, `gcloud ...`, `az ...` | Cloud SDK rate limits | `max_attempts: 3, interval: 5s, backoff_rate: 2.0` |
| `git push` to remote | Network, momentary auth issues | `max_attempts: 3, interval: 3s` |
| Database queries against remote | Network, momentary load | `max_attempts: 3, interval: 2s` |

## Patterns That Should NOT Have Retry

| Pattern | Reason |
|---|---|
| Local file ops (`cp`, `mv`, `rm`, `mkdir`) | Deterministic — retry won't help |
| `echo`, `cat`, `printf` | Trivial, can't fail in flaky way |
| Local script execution that's deterministic | If it fails it's a bug, retry just delays |
| Build commands that take minutes (`npm run build`, `cargo build`) | Long retries waste time; let user re-run |
| Destructive ops (`rm -rf`, `DROP TABLE`) | NEVER retry — could double-execute |

## Retry Configuration Defaults

Standard retry block:
```yaml
retry:
  max_attempts: 3
  interval: 2s
  backoff_rate: 2.0      # exponential: 2s, 4s, 8s
  max_delay: 60s         # cap individual delay
  jitter: 0.3            # +/- 30% randomness, prevents thundering herd
```

For health checks (longer initial wait, fixed interval):
```yaml
retry:
  max_attempts: 5
  interval: 10s
  backoff_rate: 1.0      # fixed delay, not exponential
```

## Catch — When to Add Rollback

Add `catch` when:
1. The step has side effects that should be reversed on failure (deploy → rollback, file create → cleanup, lock → release)
2. The user explicitly performed a rollback/cleanup during the session
3. The step is in a critical path that must NOT leave the system in a broken state

```yaml
- name: deploy
  func: shell
  do: kubectl apply -f deploy.yml
  retry: { max_attempts: 3, interval: 5s }
  catch:
    - name: rollback
      func: shell
      do: kubectl rollout undo deployment/app
    - name: alert
      func: http
      args:
        url: "{{ env.SLACK_WEBHOOK }}"
        method: POST
        body:
          text: "Deploy {{ vars.version }} failed and was rolled back"
```

## Finally — When to Add Cleanup

Add `finally` when the user clearly cleaned up at the end of the session regardless of success: removing temp files, releasing locks, closing connections.

```yaml
- name: extract_data
  func: shell
  do: ./extract.sh
  finally:
    - name: cleanup_tmp
      func: shell
      do: rm -rf /tmp/extract-*
```

## on_error Modes

| Mode | Behavior | When to use |
|---|---|---|
| `fail` (default) | Stop the workflow, mark failed | Critical steps |
| `ignore` | Continue, no error logged | Truly optional steps where failure is fine |
| `warn` | Continue, log warning | Optional steps you want to track but not block |

Common use:
```yaml
- name: lint
  func: shell
  do: eslint .
  on_error: warn       # Don't block deploy on lint, but flag it

- name: security_scan
  func: shell
  do: trivy fs .
  on_error: warn       # Same idea
```

## Captured Session Signals

Look at the session for these signals to decide what to add:

| Session signal | Treatment |
|---|---|
| User ran the same command 2-3 times before it succeeded | Add retry to that step |
| User waited and re-checked something | Add `wait` step + retry on the check |
| User did a rollback after a failure | Add `catch` to the original failing step |
| User said "let me just clean up" | Add `finally` block |
| User said "this is optional, doesn't matter if it fails" | Add `on_error: warn` or `ignore` |

## Anti-Patterns

- Adding retry to local deterministic commands (file copy, echo)
- Setting `max_attempts: 100` (massive retries hide real problems)
- Adding `catch` without an actual rollback action — it just suppresses the error
- Using `on_error: ignore` on critical path steps (silent failures = bugs in disguise)
- Wrapping the entire workflow in retry (retry individual flaky steps, not whole tasks)
- Using exponential backoff on health checks (you usually want a fixed interval)
