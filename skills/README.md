# OrchStep Skills for LLM Agents

Skill documents teach LLM agents how to use OrchStep effectively. Each skill is a self-contained guide designed for AI agent consumption.

## Available Skills

| Skill | Description | Use When |
|-------|-------------|----------|
| **[orchstep-capture](orchstep-capture/SKILL.md)** | **Capture a Claude Code session as a replayable workflow** | **You just finished a multi-step task in CC and want to replay it later or share it. The "session-to-YAML" magic moment.** |
| [orchstep-workflow-design](orchstep-workflow-design/SKILL.md) | Write production-grade OrchStep YAML workflows | Building deployment pipelines, automation runbooks, multi-step workflows from a blank YAML |
| [orchstep-module-creation](orchstep-module-creation/SKILL.md) | Create and publish reusable modules | Packaging patterns for team sharing and distribution |
| [orchstep-task-runner](orchstep-task-runner/SKILL.md) | Run and manage workflows via CLI | Executing pipelines, debugging failures, CI/CD integration |
| [orchstep-mcp-integration](orchstep-mcp-integration/SKILL.md) | Use the OrchStep MCP server | Native LLM agent integration, programmatic workflow management |

## How Skills Work

Each skill directory contains a `SKILL.md` file with:
- A YAML frontmatter block (name, description)
- Quick reference for the most common operations
- Detailed examples with realistic scenarios
- Anti-patterns and best practices
- Tips specific to LLM agent usage

Skills are designed to be loaded into an LLM agent's context to enable it to perform OrchStep tasks accurately without additional documentation.

## Installing Skills

Install `orchstep-workflow-design` user-wide with one of these commands, then start a new agent session so it discovers the skill.

### Claude Code

**Recommended — plugin (all five skills + the OrchStep MCP server, auto-updates):**

```text
/plugin install orchstep --marketplace orchstep/orchstep
```

Terminal equivalent: `claude plugin marketplace add orchstep/orchstep && claude plugin install orchstep@orchstep`.

**Manual — a single skill:**

```bash
mkdir -p ~/.claude/skills && curl -fsSL https://github.com/orchstep/orchstep/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C ~/.claude/skills orchstep-main/skills/orchstep-workflow-design
```

Use `.claude/skills/` inside a project instead of `~/.claude/skills/` for a project-scoped installation. Verify that `~/.claude/skills/orchstep-workflow-design/SKILL.md` exists, then invoke `/orchstep-workflow-design` or describe the workflow you want.

### Codex

```bash
mkdir -p ~/.codex/skills && curl -fsSL https://github.com/orchstep/orchstep/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C ~/.codex/skills orchstep-main/skills/orchstep-workflow-design
```

Verify that `~/.codex/skills/orchstep-workflow-design/SKILL.md` exists, then start a new Codex session and ask it to design an OrchStep workflow. Codex discovers skills from `~/.codex/skills` by default; if `CODEX_HOME` is set, use `$CODEX_HOME/skills` instead.

### Other agents

If an agent supports `SKILL.md` packages, copy the whole `skills/orchstep-workflow-design` directory into its skills directory. Otherwise, add the raw [`SKILL.md`](https://raw.githubusercontent.com/orchstep/orchstep/main/skills/orchstep-workflow-design/SKILL.md) URL to the agent's project instructions.
