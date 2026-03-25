---
name: orchstep-workflow-authoring
description: Write OrchStep YAML workflows for task orchestration. Use when building deployment pipelines, automation runbooks, or multi-step operational workflows.
---

# OrchStep Workflow Authoring

You are authoring workflows for OrchStep, a YAML-first workflow orchestration engine.

## Quick Reference

A workflow is defined in `orchstep.yml`:

```yaml
name: my-workflow
desc: "What this workflow does"

vars:
  env: staging
  version: "1.0.0"

tasks:
  deploy:
    desc: "Deploy the application"
    steps:
      - name: build
        func: shell
        do: |
          echo "Building version {{ vars.version }}"
          echo "BUILD_ID=build-123"
        outputs:
          build_id: '{{ result.output | regexFind "BUILD_ID=(.+)" }}'

      - name: deploy
        func: shell
        do: |
          echo "Deploying {{ steps.build.build_id }} to {{ vars.env }}"

      - name: verify
        func: assert
        args:
          condition: '{{ ne steps.build.build_id "" }}'
          desc: "Build ID must not be empty"
```

## Running Workflows

```bash
orchstep run deploy                          # Run the deploy task
orchstep run deploy --var env=production     # Override variable
orchstep run deploy --format json            # Structured output for agents
```

## Available Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `shell` | Run shell commands | `do: echo "hello"` |
| `http` | Make HTTP requests | `args: { url: "...", method: GET }` |
| `git` | Git operations | Shell-based: `do: git clone ...` |
| `assert` | Validate conditions | `args: { condition: "{{ ... }}" }` |
| `transform` | JavaScript data transform | `do: "return { key: value };"` |
| `render` | Template rendering | `args: { template: "..." }` |
| `wait` | Delay execution | `args: { duration: 5s }` |
| `task` | Call another task | `task: other-task` |

## Variable Scoping

Variables have 4 levels of precedence (highest to lowest):
1. `--var key=value` (runtime)
2. Step-level `vars:`
3. Task-level `vars:`
4. File-level `vars:`

Access with `{{ vars.key }}`. Access step outputs with `{{ steps.step_name.output_field }}`.

## Control Flow

### Conditionals
```yaml
- name: check
  func: shell
  if: '{{ eq vars.env "production" }}'
  do: echo "Production deploy!"
```

### If/Elif/Else
```yaml
- name: route
  if: '{{ eq vars.env "production" }}'
  then:
    - func: shell
      do: echo "Prod deploy"
  elif:
    - if: '{{ eq vars.env "staging" }}'
      then:
        - func: shell
          do: echo "Staging deploy"
  else:
    then:
      - func: shell
        do: echo "Dev deploy"
```

### Switch/Case
```yaml
- name: route
  switch:
    value: '{{ vars.env }}'
    cases:
      - when: 'production'
        task: deploy_prod
      - when: 'staging'
        task: deploy_staging
    default:
      - task: deploy_dev
```

### Loops
```yaml
- name: deploy-each
  func: shell
  loop: ["us-east-1", "eu-west-1", "ap-southeast-1"]
  do: echo "Deploying to {{ loop.item }}"
```

Loop variables: `loop.item`, `loop.index`, `loop.first`, `loop.last`, `loop.length`

### Error Handling
```yaml
- name: risky-step
  func: shell
  do: might-fail-command
  retry:
    max_attempts: 3
    interval: 2s
    backoff_rate: 2.0
  catch:
    - name: rollback
      func: shell
      do: rollback.sh
  finally:
    - name: cleanup
      func: shell
      do: rm -rf /tmp/artifacts
  on_error: continue
```

## Task Calling with Parameters

```yaml
tasks:
  main:
    steps:
      - task: deploy
        with:
          environment: production
          replicas: 5

  deploy:
    vars:
      environment: dev
      replicas: 1
    steps:
      - func: shell
        do: echo "{{ vars.environment }} - {{ vars.replicas }} replicas"
```

## Output Extraction

```yaml
- name: build
  func: shell
  do: |
    echo "IMAGE=myapp:v1.2.3"
    echo "DIGEST=sha256:abc123"
  outputs:
    image: '{{ result.output | regexFind "IMAGE=(.+)" }}'
    digest: '{{ result.output | regexFind "DIGEST=(.+)" }}'
```

## HTTP Requests

```yaml
- name: health_check
  func: http
  args:
    url: "https://{{ vars.env }}.example.com/health"
    method: GET
    auth:
      type: bearer
      token: "{{ vars.api_token }}"
  outputs:
    status: "{{ result.status_code }}"
    body: "{{ result.data }}"
```

## Patterns

### Deploy Pipeline
```yaml
tasks:
  deploy:
    steps:
      - name: build
        func: shell
        do: docker build -t app:{{ vars.version }} .
      - name: push
        func: shell
        do: docker push app:{{ vars.version }}
      - name: deploy
        func: shell
        do: kubectl set image deployment/app app=app:{{ vars.version }}
      - name: health-check
        func: http
        args:
          url: "https://{{ vars.env }}.example.com/health"
          method: GET
        retry:
          max_attempts: 5
          interval: 10s
      - name: verify
        func: assert
        args:
          condition: '{{ eq steps.health-check.status_code 200 }}'
          desc: "Health check must return 200"
```

### Multi-Environment Promotion
```yaml
tasks:
  promote:
    steps:
      - name: deploy-envs
        loop: ["staging", "production"]
        task: deploy_single
        with:
          environment: "{{ loop.item }}"
          version: "{{ vars.version }}"

  deploy_single:
    steps:
      - func: shell
        do: echo "Deploying {{ vars.version }} to {{ vars.environment }}"
```

### CI/CD with Quality Gates
```yaml
tasks:
  ci:
    steps:
      - name: build
        func: shell
        do: npm run build

      - name: lint
        func: shell
        do: eslint .
        on_error: warn

      - name: test
        func: shell
        do: npm test

      - name: security_scan
        func: shell
        do: npm audit
        on_error: warn

      - name: deploy
        if: '{{ eq vars.deploy "true" }}'
        func: shell
        do: kubectl apply -f deployment.yml
```

### Retry with Rollback
```yaml
tasks:
  safe_deploy:
    steps:
      - name: deploy
        func: shell
        do: kubectl apply -f deployment.yml
        timeout: 60s
        retry:
          max_attempts: 3
          interval: 5s
        catch:
          - name: rollback
            func: shell
            do: kubectl rollback deployment/app
          - name: alert
            func: http
            args:
              url: "https://hooks.slack.com/services/..."
              method: POST
              body:
                text: "Deploy failed, rolled back"
        finally:
          - name: cleanup
            func: shell
            do: rm -rf /tmp/deploy-artifacts
```

## Anti-Patterns

- Don't put secrets directly in YAML -- use environment variables or vault
- Don't use deeply nested tasks (max 2 levels) -- flatten instead
- Don't ignore assertion failures -- they indicate real problems
- Don't hardcode paths -- use variables for environment-specific values
- Don't skip `on_error` for non-critical steps -- use `warn` or `ignore` explicitly
