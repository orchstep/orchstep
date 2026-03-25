# Introducing OrchStep: Workflow Orchestration for the AI Agent Era

Every engineering team has the same dirty secret: somewhere in your infrastructure, there's a 400-line bash script held together with `set -e` and hope. It deploys your app, rotates your secrets, or runs your incident response playbook. It works — until it doesn't.

On the other end of the spectrum, enterprise orchestration platforms promise to solve everything. But they require dedicated infrastructure, proprietary DSLs, vendor lock-in, and a six-figure contract. For most teams, that's trading one problem for another.

OrchStep sits in the gap between those two worlds.

## What is OrchStep?

OrchStep is a workflow orchestration engine distributed as a single binary. You define multi-step workflows in YAML. OrchStep handles execution order, retry logic, error handling, variable management, and control flow. It delegates actual work to the tools you already have — terraform, kubectl, aws, docker, curl — rather than reimplementing them behind proprietary abstractions.

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
```

Install it with one command:

```bash
curl -fsSL https://orchstep.dev/install.sh | sh
```

Or use your preferred package manager: Homebrew, npm, pip, or Docker.

## Shell-First, Not Shell-Only

OrchStep's design philosophy is "shell-first." Your existing CLI tools are the execution layer. OrchStep adds the orchestration layer on top: sequencing, parallelism, retries, conditionals, loops, error boundaries, and variable scoping.

This means there's nothing new to learn for the actual work your workflows perform. If you can run it in a terminal, you can run it in OrchStep. The YAML spec adds seven built-in functions — `shell`, `http`, `assert`, `transform`, `render`, `wait`, and `git` — that cover the patterns every operational workflow needs.

The spec also includes rich control flow that bash scripts struggle with: `if/else` branching, `switch` statements, `for_each` loops, `retry` with exponential backoff, and `try/catch/finally` error handling. All expressed declaratively in YAML.

## Built for AI Agents

Here's where OrchStep diverges from every other orchestration tool: it was designed from the start for AI agent integration.

Every OrchStep command supports `--format json` for structured, machine-parseable output. But the real integration point is the built-in MCP (Model Context Protocol) server. Run `orchstep mcp serve` and any MCP-compatible LLM agent — Claude Code, for example — can use OrchStep as a native tool. The agent can list workflows, execute tasks, inspect results, and search the module registry, all through structured tool calls.

We also ship skill documents — structured guides that teach LLM agents how to write OrchStep workflows, create modules, use the MCP server, and run tasks. Install a skill document, and your AI coding assistant understands OrchStep patterns natively.

The module system takes this further. Humans contribute modules via pull request. AI agents contribute via `orchstep module submit`. Modules land in separate trust tiers — `@orchstep/` for official, `@community/` for human-reviewed, `@ai/` for agent-submitted — so you always know the provenance of what you're running.

## The Business Model

OrchStep Community Edition is free forever. That's the full execution engine: all seven functions, unlimited concurrency, all public modules, the MCP server, everything you need to orchestrate workflows.

OrchStep Pro adds features that teams and organizations need: a private module registry, role-based access control, audit logging, AI agent governance policies, and advanced tooling. Pro is $49 per user per month. Enterprise pricing is available for organizations that need SSO, compliance certifications, and SLA guarantees.

The open content — the YAML spec, modules, skill documents, demos, and documentation — lives in the public GitHub repo under Apache 2.0. The engine binary has a separate proprietary license.

## Getting Started

Install OrchStep and run one of the ten included demos to see it in action:

```bash
# Install
curl -fsSL https://orchstep.dev/install.sh | sh

# Run a demo
cd demos/01-post-deploy-smoke-test
orchstep run
```

The demos cover real-world scenarios: post-deploy smoke tests, release notes generation, secret rotation, multi-repo version bumps, incident response runbooks, infrastructure drift detection, developer onboarding, flaky test triage, AI agent task pipelines, and compliance evidence collection.

Browse the spec in `spec/`, explore official modules in `modules/@orchstep/`, and check out the skill documents in `skills/` to see how AI agents interact with OrchStep.

## What's Next

OrchStep is launching today. Here's what we're focused on next:

- **Module ecosystem growth.** The five official modules (slack-notify, health-check, git-release, env-check, report-gen) are just the start. We're actively accepting community and AI-submitted modules.
- **More skill documents.** As LLM agents evolve, we'll publish new skills that teach them advanced OrchStep patterns.
- **Community feedback.** The YAML spec is designed to be stable, but we want to hear how teams use it in practice. File issues, open discussions, contribute modules.

We built OrchStep because we believe workflow orchestration should be simple enough for a bash script, powerful enough for production, and accessible to both humans and AI agents.

Try it out: [github.com/orchstep/orchstep](https://github.com/orchstep/orchstep)
