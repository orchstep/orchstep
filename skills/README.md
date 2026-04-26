# OrchStep Skills for LLM Agents

Skill documents teach LLM agents how to use OrchStep effectively. Each skill is a self-contained guide designed for AI agent consumption.

## Available Skills

| Skill | Description | Use When |
|-------|-------------|----------|
| **[orchstep-capture](orchstep-capture/SKILL.md)** | **Capture a Claude Code session as a replayable workflow** | **You just finished a multi-step task in CC and want to replay it later or share it. The "session-to-YAML" magic moment.** |
| [orchstep-workflow-authoring](orchstep-workflow-authoring/SKILL.md) | Write OrchStep YAML workflows from scratch | Building deployment pipelines, automation runbooks, multi-step workflows from a blank YAML |
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
