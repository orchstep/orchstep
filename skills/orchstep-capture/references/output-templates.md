# Output Templates

Starter scaffolds for the most common captured workflow shapes. Use as a structural starting point, then fill in steps from the captured session.

## When to Use This Reference

Load this reference ONLY when the captured workflow clearly matches one of the shapes below. If unsure, compose the YAML freehand from the inventoried events. Templates speed up common cases; they're not mandatory.

## Template 1: Build → Deploy → Verify

For: deploys, releases, rollouts.

```yaml
name: <name>
desc: "<what this deploy does, e.g. Deploy v1.2.3 to staging>"

defaults:
  env: staging
  version: "<extracted>"

tasks:
  main:
    desc: "<one-line goal>"
    steps:
      - name: build
        func: shell
        do: |
          <build commands from session>
        outputs:
          image: '<extracted from build output>'

      - name: deploy
        func: shell
        do: |
          <deploy commands>
        retry:
          max_attempts: 3
          interval: 5s
          backoff_rate: 2.0
        catch:
          - name: rollback
            func: shell
            do: |
              <rollback commands if user did one>

      - name: verify_health
        func: http
        args:
          url: "https://{{ vars.env }}.<host>/health"
          method: GET
        retry:
          max_attempts: 5
          interval: 10s
        outputs:
          status: '{{ result.status_code }}'

      - name: assert_healthy
        func: assert
        args:
          condition: '{{ eq steps.verify_health.status 200 }}'
          desc: "Goal: deployment must be healthy after rollout"
```

## Template 2: Data Pipeline (Fetch → Transform → Output)

For: ETL-like sessions, report generation, data shaping.

```yaml
name: <name>
desc: "<e.g. Fetch user data, compute active count, write report>"

defaults:
  source_url: "<extracted>"
  output_path: "/tmp/<name>-report.md"

tasks:
  main:
    steps:
      - name: fetch
        func: http
        args:
          url: "{{ vars.source_url }}"
          method: GET
        retry:
          max_attempts: 3
          interval: 2s
        outputs:
          raw: '{{ result.data }}'

      - name: transform
        func: transform
        do: |
          const data = JSON.parse(steps.fetch.raw);
          return {
            count: data.items.length,
            summary: data.items.map(i => i.name).join(', ')
          };
        outputs:
          count: '{{ result.count }}'
          summary: '{{ result.summary }}'

      - name: write_report
        func: render
        args:
          template: |
            # Report
            Total items: {{ .count }}
            Items: {{ .summary }}
          data:
            count: "{{ steps.transform.count }}"
            summary: "{{ steps.transform.summary }}"
          output: "{{ vars.output_path }}"

      - name: assert_nonempty
        func: assert
        args:
          condition: '{{ gt (atoi steps.transform.count) 0 }}'
          desc: "Goal: must have at least one item"
```

## Template 3: Smoke Test / Health Suite

For: post-deploy checks, dependency verification, readiness probes.

```yaml
name: <name>
desc: "<e.g. Post-deploy smoke tests for staging>"

defaults:
  env: staging
  base_url: "https://{{ vars.env }}.example.com"

tasks:
  main:
    steps:
      - name: check_endpoints
        loop:
          - { path: "/health", expected: 200 }
          - { path: "/api/v1/status", expected: 200 }
          - { path: "/metrics", expected: 200 }
        as: ep
        func: http
        args:
          url: "{{ vars.base_url }}{{ ep.path }}"
          method: GET
        outputs:
          status: '{{ result.status_code }}'

      - name: assert_all_healthy
        func: assert
        args:
          condition: 'all(steps.check_endpoints.outputs, "status", 200)'
          desc: "Goal: all endpoints must return 200"
```

## Template 4: Multi-Step Debug / Fix

For: sessions where the user identified a bug, fixed it, verified.

```yaml
name: <name>
desc: "<e.g. Reproduce, fix, and verify the X bug>"

defaults:
  test_command: "<extracted>"

tasks:
  main:
    steps:
      - name: reproduce
        func: shell
        do: |
          <command that reproduces the bug>
        on_error: warn          # Reproduction is expected to fail initially

      - name: apply_fix
        func: shell
        do: |
          <fix commands — could be sed, patch, or git apply>

      - name: verify_fix
        func: shell
        do: |
          {{ vars.test_command }}

      - name: assert_passing
        func: assert
        args:
          condition: '{{ eq steps.verify_fix.exit_code 0 }}'
          desc: "Goal: tests must pass after fix"
```

## Template 5: Multi-Repo / Multi-Env Iteration

For: sessions where the user did the same operation across multiple targets.

```yaml
name: <name>
desc: "<e.g. Update dependency across 5 repos>"

defaults:
  targets: ["repo1", "repo2", "repo3"]
  branch: "auto/update-dep"

tasks:
  main:
    steps:
      - name: process_each
        loop: "{{ vars.targets }}"
        as: repo
        task: process_one
        with:
          repo: "{{ repo }}"
          branch: "{{ vars.branch }}"

  process_one:
    steps:
      - name: clone
        func: shell
        do: git clone "https://github.com/owner/{{ vars.repo }}.git" "/tmp/{{ vars.repo }}"

      - name: update
        func: shell
        do: |
          cd /tmp/{{ vars.repo }}
          <update commands>

      - name: pr
        func: shell
        do: |
          cd /tmp/{{ vars.repo }}
          gh pr create --title "Auto-update" --body "..."
```

## Template 6: Conditional Routing

For: sessions where the user took different actions based on env or input.

```yaml
name: <name>
desc: "<e.g. Deploy with env-specific verification>"

defaults:
  env: staging

tasks:
  main:
    steps:
      - name: deploy
        func: shell
        do: ./deploy.sh --env {{ vars.env }}

      - name: env_specific_verify
        if: '{{ eq vars.env "production" }}'
        then:
          - name: verify_prod_specific
            func: shell
            do: ./verify-prod.sh
        else:
          then:
            - name: verify_basic
              func: shell
              do: ./verify-basic.sh
```

## Picking the Right Template

| Captured shape | Template |
|---|---|
| Build command + deploy command + health check | Template 1 |
| HTTP fetch + data manipulation + output | Template 2 |
| Several health/status checks | Template 3 |
| Bug reproduction + fix + verification | Template 4 |
| Same operation across multiple targets | Template 5 |
| Different commands based on env/input | Template 6 |
| None of the above | Compose freehand from `references/yaml-syntax.md` |

## Anti-Patterns

- Forcing a captured session into a template that doesn't fit (just compose freehand)
- Copy-pasting the template wholesale without removing unused steps
- Adding retries to non-flaky template steps (defeats the point of the template defaults)
- Renaming template var names without updating references in the steps
