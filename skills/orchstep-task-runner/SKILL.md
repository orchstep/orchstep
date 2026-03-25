---
name: orchstep-task-runner
description: Run and manage OrchStep workflows via CLI. Use when executing deployment pipelines, debugging workflow failures, or integrating OrchStep into CI/CD systems.
---

# OrchStep Task Runner

You are running and managing OrchStep workflows via the CLI.

## Core Commands

### Run a Task

```bash
orchstep run <task-name> [flags]
```

| Flag | Description | Example |
|------|-------------|---------|
| `--var key=value` | Set runtime variable | `--var env=production` |
| `--vars-file path` | Load variables from file | `--vars-file prod.yml` |
| `--format json` | Output as structured JSON | For agent consumption |
| `--log-level level` | Log verbosity | `debug`, `info`, `warn`, `error` |
| `--dry-run` | Validate without executing | Check before running |

**Examples:**

```bash
# Run deploy task
orchstep run deploy

# Override variables
orchstep run deploy --var env=production --var version=2.0.0

# Load variables from file and override one
orchstep run deploy --vars-file environments/prod.yml --var version=2.0.0

# JSON output for parsing
orchstep run deploy --format json

# Debug logging
orchstep run deploy --log-level debug
```

### List Available Tasks

```bash
orchstep list-tasks
```

Output:
```
  deploy       Deploy the application
  rollback     Rollback to previous version
  health       Run health checks
  test         Execute test suite
```

### Lint a Workflow

```bash
# Lint current directory
orchstep lint

# Lint specific file
orchstep lint path/to/orchstep.yml
```

Catches: duplicate variables, unused variables, invalid templates, schema violations.

### Version Info

```bash
orchstep version
```

## Reading JSON Output

When using `--format json`, output is machine-readable:

```bash
orchstep run deploy --format json
```

```json
{
  "task": "deploy",
  "status": "success",
  "duration": "12.5s",
  "steps": [
    {
      "name": "build",
      "status": "success",
      "duration": "8.2s",
      "outputs": {
        "image_tag": "myapp:v1.2.3"
      }
    },
    {
      "name": "push",
      "status": "success",
      "duration": "3.1s"
    }
  ]
}
```

### Parsing JSON Output

```bash
# Extract specific field with jq
orchstep run deploy --format json | jq '.steps[0].outputs.image_tag'

# Check overall status
orchstep run deploy --format json | jq '.status'

# Get duration
orchstep run deploy --format json | jq '.duration'
```

## Error Interpretation

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Step execution failure |
| 2 | Workflow validation error |
| 3 | File not found / invalid path |
| 124 | Timeout exceeded |

### Common Errors

**Step failed:**
```
Step 'deploy' failed (exit code 1)
Output: error: deployment "app" not found
```
Fix: Check the command and prerequisites.

**Assertion failed:**
```
Step 'verify' failed: assertion failed
Condition: {{ eq steps.health.status_code 200 }}
Actual: 503
Message: Health check must return 200
```
Fix: The service is not healthy. Check deployment status.

**Template error:**
```
Step 'build' failed: template error
failed to parse template: function "unknownFunc" not defined
```
Fix: Check template syntax. Use valid Sprig/Go template functions.

**Variable not found:**
```
Step 'deploy' failed: template error
vars.missing_variable: variable not defined
```
Fix: Define the variable in `vars:` or pass via `--var`.

**Timeout:**
```
Step 'long_task' failed: timeout after 30s
```
Fix: Increase the `timeout` value or optimize the operation.

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install OrchStep
        run: curl -sSL https://orchstep.dev/install.sh | bash

      - name: Run deployment
        run: |
          orchstep run deploy \
            --var version=${{ github.sha }} \
            --var env=production \
            --format json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  script:
    - curl -sSL https://orchstep.dev/install.sh | bash
    - orchstep run deploy --var version=$CI_COMMIT_SHA --var env=production
  only:
    - main
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                sh 'orchstep run deploy --var version=${GIT_COMMIT} --var env=production --format json'
            }
        }
    }
}
```

## Debugging Workflows

### Step 1: Enable Debug Logging

```bash
orchstep run deploy --log-level debug
```

Shows: variable resolution, template rendering, step timing, retry attempts.

### Step 2: Lint First

```bash
orchstep lint
```

Catches structural issues before execution.

### Step 3: Check Variable Resolution

```yaml
# Add a debug step temporarily
- name: debug_vars
  func: shell
  do: |
    echo "env={{ vars.environment }}"
    echo "version={{ vars.version }}"
    echo "replicas={{ vars.replicas }}"
```

### Step 4: Use Context Inspector

```bash
# Enable context collection
export ORCHSTEP_CONTEXT_ENABLED=true

# Run workflow
orchstep run deploy

# Inspect execution artifacts
orchstep-inspect
```

The TUI inspector shows variables, outputs, logs, and timing for each step.

## Common Patterns

### Run and Capture Output

```bash
# Capture JSON output to variable
RESULT=$(orchstep run deploy --format json)
STATUS=$(echo "$RESULT" | jq -r '.status')

if [ "$STATUS" != "success" ]; then
  echo "Deployment failed!"
  echo "$RESULT" | jq '.steps[] | select(.status != "success")'
  exit 1
fi
```

### Multi-Stage Pipeline

```bash
# Build -> Test -> Deploy
orchstep run build --var version=$VERSION && \
orchstep run test && \
orchstep run deploy --var version=$VERSION --var env=production
```

### Environment-Specific Runs

```bash
# Use vars files per environment
orchstep run deploy --vars-file environments/staging.yml
orchstep run deploy --vars-file environments/production.yml
```

### Scheduled Health Checks

```bash
# Cron job: check every 5 minutes
*/5 * * * * orchstep run health_check --format json >> /var/log/health.log 2>&1
```

## Tips for LLM Agents

- Always use `--format json` when parsing output programmatically
- Use `orchstep list-tasks` to discover available tasks before running
- Use `orchstep lint` to validate YAML before execution
- Check exit code after `orchstep run` to determine success/failure
- Use `--var` for dynamic values, `--vars-file` for environment configs
- Combine `--log-level debug` with `--format json` for detailed diagnostics
