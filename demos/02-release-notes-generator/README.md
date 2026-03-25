# Demo 02: Release Notes Generator

## What It Does

Simulates a release pipeline that collects git commits between two version tags,
categorizes them (features, fixes, docs, chores), formats a structured
changelog, creates a git tag, and prints a release summary.

## Pain Point It Solves

Writing release notes is tedious and error-prone. Engineers either skip them
entirely or produce inconsistent, incomplete changelogs. This workflow
automates the process: commits are categorized by their conventional-commit
prefix, counts are tracked, and a reproducible markdown document is generated
every time.

## Features Demonstrated

- **Definition variables** (`defaults:`) for version numbers, project name, and
  repository URL.
- **Multi-step pipelines** where each step feeds outputs into the next.
- **Step outputs** to pass commit counts and tag status between steps.
- **Assertions** to gate the process (no empty releases, tag must succeed).
- **Template expressions** (`{{ steps.categorize.feature_count }}`) embedded in
  shell scripts to build dynamic output.
- **Task delegation** -- `main` calls `generate` as a reusable sub-task.

## How to Run

```bash
orchstep run
```

Override version numbers:

```bash
orchstep run --var version=3.0.0 --var previous_version=2.5.0
```

## Adapting for Production

1. Replace the `echo`-based commit list with a real `git log --oneline` command
   filtered between the two version tags.
2. Parse commit prefixes (`feat:`, `fix:`, `docs:`) programmatically with
   `grep` or a small script, and use `outputs:` with `regexFind` to extract
   counts.
3. Write the formatted changelog to a file (`CHANGELOG.md`) instead of stdout.
4. Use `func: http` to create a GitHub/GitLab release via the API, attaching
   the generated notes as the release body.
5. Add a Slack notification step at the end to announce the release to the team.
