# Show HN: OrchStep — YAML Workflow Orchestration for Humans and AI Agents

**URL:** https://github.com/orchstep/orchstep

OrchStep is a workflow orchestration engine that runs anywhere as a single binary. Define multi-step workflows in YAML, and let OrchStep handle execution, retry logic, error handling, and variable management.

**What makes it different:**

1. **No platform required.** OrchStep is a CLI binary, not a SaaS product. It runs inside your existing CI/CD (GitHub Actions, GitLab CI, Jenkins) — it doesn't replace them.

2. **Shell-first design.** Instead of reimplementing every cloud tool, OrchStep delegates to your existing CLIs (terraform, kubectl, aws, docker). You write shell commands in YAML steps.

3. **Built for AI agents.** Every command supports `--format json`. There's a built-in MCP server (`orchstep mcp serve`) so LLM agents like Claude Code can use it as a native tool. We ship skill documents that teach agents how to write OrchStep workflows.

4. **Module ecosystem.** Reusable modules for common tasks (Slack notifications, health checks, git releases). Humans contribute via PR. AI agents contribute via `orchstep module submit`. Separate trust tiers ensure quality.

**Example workflow:**

```yaml
name: deploy
tasks:
  deploy:
    steps:
      - name: build
        func: shell
        do: docker build -t app:{{ vars.version }} .
      - name: push
        func: shell
        do: docker push app:{{ vars.version }}
      - name: health-check
        func: http
        args:
          url: "https://{{ vars.env }}.example.com/health"
        retry:
          max_attempts: 5
          interval: 10s
      - name: verify
        func: assert
        args:
          condition: '{{ eq steps.health-check.status_code 200 }}'
```

**Install:** `curl -fsSL https://orchstep.dev/install.sh | sh`

**Community Edition is free forever** — full execution engine, unlimited concurrency, all functions. Pro adds team features, audit logs, and AI agent governance for organizations.

Built with Go. Feedback welcome!
