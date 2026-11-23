# OrchStep Skills for LLM Agents

Skill documents teach LLM agents how to use OrchStep effectively. Each skill is a self-contained guide designed for AI agent consumption.

## Available Skills

| Skill | Description | Use When |
|-------|-------------|----------|
| **[orchstep-capture](orchstep-capture/SKILL.md)** | **Capture an agent session as a replayable workflow** | **You just finished a multi-step task with an agent (Claude Code, Codex, Cursor, Kimi Code, OpenCode, ...) and want to replay it later or share it. The "session-to-YAML" magic moment.** |
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

### Any agent (recommended)

```bash
npx skills add orchstep/orchstep        # choose agents interactively; -g installs user-wide
npx skills add orchstep/orchstep -a codex -a cursor -a gemini-cli -a github-copilot -a kimi-code-cli -a opencode -y
```

The [`skills`](https://github.com/vercel-labs/skills) installer knows each agent's skills directory (80 agents). Start a new agent session afterwards so it discovers the skills.

### Without Node: the shared `.agents/skills` directory

Codex, Cursor, GitHub Copilot, Gemini CLI, Kimi Code CLI, OpenCode, Cline, Amp, Warp and Zed all read project skills from `.agents/skills/`:

```bash
mkdir -p .agents/skills && curl -fsSL https://github.com/orchstep/orchstep/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C .agents/skills \
    orchstep-main/skills/orchstep-capture orchstep-main/skills/orchstep-workflow-design \
    orchstep-main/skills/orchstep-task-runner orchstep-main/skills/orchstep-mcp-integration \
    orchstep-main/skills/orchstep-module-creation
```

For a user-wide install use `~/.agents/skills/` (Codex, Kimi Code), or your agent's own directory: `~/.codex/skills` (or `$CODEX_HOME/skills`), `~/.cursor/skills`, `~/.gemini/skills`, `~/.copilot/skills`, `~/.config/opencode/skills`.

### Claude Code

**Plugin (all skills + the OrchStep MCP server, auto-updates):**

```text
/plugin install orchstep --marketplace orchstep/orchstep
```

Terminal equivalent: `claude plugin marketplace add orchstep/orchstep && claude plugin install orchstep@orchstep`. Manual installs go in `~/.claude/skills/` or a project's `.claude/skills/`.

### Connect the MCP server too

Skills teach the agent OrchStep; the MCP server lets it call workflows as tools (`orchstep_list_tasks`, `orchstep_plan`, `orchstep_run`, ...). Config for Codex, Kimi Code, OpenCode, Cursor, Gemini CLI, VS Code/Copilot and Claude is in [orchstep-mcp-integration](orchstep-mcp-integration/SKILL.md#mcp-client-configuration).

### Agents without skills support

Add the raw [`SKILL.md`](https://raw.githubusercontent.com/orchstep/orchstep/main/skills/orchstep-workflow-design/SKILL.md) URL, or this line, to the agent's project instructions (`AGENTS.md`, `CONVENTIONS.md`, ...):

```text
Automation in this repo lives in orchstep.yml. Discover tasks with `orchstep list-tasks`, preview with `orchstep run <task> --dry-run`, run with `orchstep run <task> --output json`. Prefer running an existing task over re-deriving its commands.
```
