# Error Handling Reference

## Retry

```yaml
- name: deploy
  func: shell
  do: kubectl apply -f deployment.yml
  retry:
    max_attempts: 3
    interval: 2s
    backoff_rate: 2.0
    max_delay: 30s
    jitter: 0.1
```

| Field | Default | Description |
|-------|---------|-------------|
| `max_attempts` | 1 | Total attempts (original + retries) |
| `interval` | 1s | Initial delay between retries |
| `backoff_rate` | 2.0 | Exponential multiplier per retry |
| `max_delay` | — | Cap on delay (prevents infinite backoff) |
| `jitter` | 0 | Random variation (±0.0–1.0 of interval) |

Conditional retry:

```yaml
- name: check_health
  func: http
  args:
    url: "https://api.example.com/health"
    method: GET
  retry:
    max_attempts: 5
    interval: 5s
    when: '{{ ne .StatusCode 200 }}'  # Only retry on non-200
```

## Catch (Error Recovery)

```yaml
- name: risky
  func: shell
  do: might-fail.sh
  catch:
    - name: rollback
      func: shell
      do: ./rollback.sh
    - name: notify
      func: http
      args:
        url: "https://hooks.slack.com/..."
        method: POST
        body:
          text: "Deploy failed, rolled back"
```

Catch runs when the step exits non-zero. Multiple catch steps run in sequence.

## Finally (Cleanup — Always Runs)

```yaml
- name: risky
  func: shell
  do: deploy.sh
  finally:
    - name: cleanup
      func: shell
      do: rm -rf /tmp/artifacts
```

`finally:` runs regardless of success or failure — even if `catch:` also runs. Task-level `finally:` runs even when the subtask fails.

## Timeouts

```yaml
- name: long_running
  func: shell
  do: slow-command.sh
  timeout: 60s         # Step-level timeout
  total_timeout: 300s   # Loop-level total timeout
```

- Step aborts when timeout expires (exit code from OS kill)
- `total_timeout` applies to the cumulative duration of all loop iterations

## on_error Strategy

```yaml
- name: lint
  func: shell
  do: eslint .
  on_error: warn        # Log warning but continue
```

| Strategy | Behavior |
|----------|----------|
| `fail` (default) | Stop workflow immediately |
| `warn` | Log the error and continue to next step |
| `ignore` | Skip silently, continue to next step |

Use `warn` or `ignore` for non-critical steps (lint, notifications, optional checks).

## Task-Level Catch/Finally

```yaml
tasks:
  dangerous:
    steps:
      - name: deploy
        func: shell
        do: deploy.sh
    catch:
      - name: rollback
        func: shell
        do: rollback.sh
    finally:
      - name: cleanup
        func: shell
        do: rm -rf /tmp/deploy
```

Task-level error handling wraps ALL steps in the task. Runs only once when the first step fails.

## Best Practices

1. ALWAYS add retry to HTTP health checks — they're the most common transient failure.
2. Use `on_error: warn` for lint/audit steps — you want the data even if the tool exit-codes non-zero.
3. Use `catch:` + rollback pattern for destructive operations (deploy, migrate, delete).
4. Use `finally:` for cleanup tasks (temp files, temp AWS resources, SSH tunnels).
5. Don't catch errors you can't recover from — let them fail fast.