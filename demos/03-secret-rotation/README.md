# Demo 03: Secret Rotation (TLS Certificate)

## What It Does

Simulates end-to-end TLS certificate rotation for a Kubernetes-deployed service.
The workflow checks the current certificate's expiry, generates a replacement,
deploys it as a Kubernetes secret, restarts the pods, verifies the new
certificate is being served (with retry), cleans up old files, and prints a
summary report.

## Pain Point It Solves

Certificate rotation is high-risk and time-sensitive. A manual process involves
multiple `openssl`, `kubectl`, and verification commands that must execute in the
right order. Missing a step (like verifying the new cert is actually served) can
cause outages. This workflow codifies the entire procedure so it runs the same
way every time.

## Features Demonstrated

- **Definition variables** (`defaults:`) for service name, namespace, cert path,
  and validity period.
- **Multi-step pipeline** with a strict order of operations: check, generate,
  deploy, verify, cleanup.
- **Step outputs** to pass certificate serials and fingerprints between steps.
- **Retry with backoff** on the verification step (`retry.max_attempts: 3`,
  `backoff_rate: 2.0`) to handle pods that haven't finished restarting yet.
- **Assertions** at critical checkpoints: rotation is needed, deployment
  succeeded, served certificate matches the generated one.
- **Task delegation** -- `main` calls `rotate` as a reusable sub-task.
- **Cross-step references** -- the cleanup step references outputs from both the
  check and generate steps to log what was replaced.

## How to Run

```bash
orchstep run
```

Override for a different service:

```bash
orchstep run \
  --var service_name=auth-gateway \
  --var namespace=staging \
  --var cert_path=/etc/tls/auth-gateway
```

## Adapting for Production

1. Replace the `echo`-based `openssl` and `kubectl` commands with real ones. The
   step structure and output extraction stay the same.
2. Add a pre-rotation step that creates a snapshot or backup of the current
   Kubernetes secret for rollback.
3. Wire the `verify_serving` step to actually connect with `openssl s_client`
   and use `regexFind` in `outputs:` to extract the served serial number.
4. Add an on-error handler that rolls back to the old secret if verification
   fails after all retry attempts.
5. Schedule the workflow to run weekly via cron and alert only when
   `days_remaining` drops below a threshold.
