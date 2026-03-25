# OrchStep: Open Orchestration Engine for DevOps and AI Agents

Hey r/devops!

I've been building OrchStep — a YAML workflow orchestration engine designed for the post-AI world.

**The pitch:** Define your operational workflows in YAML. Run them anywhere with a single binary. Let your AI coding agents (Claude Code, Copilot, etc.) generate and execute workflows alongside your team.

**Key features:**
- Single binary, runs everywhere (macOS, Linux, Windows)
- Runs INSIDE your existing CI/CD (GitHub Actions, GitLab CI, Jenkins)
- Shell-first: uses your existing tools (terraform, kubectl, aws)
- Rich control flow: if/else, switch, loops, retry with backoff, try/catch
- Variable scoping with 4 levels of precedence
- Module system for reusable workflow components
- MCP server for native LLM agent integration
- Skill documents that teach AI agents your orchestration patterns

**What it's NOT:**
- Not a CI/CD platform (use it with GitHub Actions)
- Not a replacement for Airflow/Prefect (those are data pipeline tools)
- Not a cloud service (it's a local binary)

**Think of it as:** what if `make` and Ansible had a baby that was designed for AI agents.

**Install:** `curl -fsSL https://orchstep.dev/install.sh | sh`

**Community Edition is free forever.** Pro adds team/audit/governance features for organizations.

GitHub: https://github.com/orchstep/orchstep

I'd love feedback on the YAML spec and module system design. What workflows would you automate with this?
