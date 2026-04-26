# Example 05: Loop Over Items (Multi-Repo Update)

## The Session

User in Claude Code:

> "Bump the orchstep dependency to 1.6.1 across our 5 repos and open PRs."

Claude ran (showing only repo1 — the user iterated through all 5):

```bash
# repo1
git clone https://github.com/myorg/repo1.git /tmp/repo1
cd /tmp/repo1
git checkout -b auto/bump-orchstep-1.6.1
sed -i '' 's/orchstep@1.5.0/orchstep@1.6.1/' package.json
git add package.json
git commit -m "chore: bump orchstep to 1.6.1"
git push origin auto/bump-orchstep-1.6.1
gh pr create --title "Bump orchstep to 1.6.1" --body "Auto-generated bump" --head auto/bump-orchstep-1.6.1

# repo2 — same pattern
# repo3 — same pattern
# repo4 — same pattern (one git push failed, retry succeeded)
# repo5 — same pattern
```

User said "all PRs opened, nice."

## The Captured YAML

`workflows/bump_dep_across_repos.yml`:

```yaml
name: bump_dep_across_repos
desc: "Bump a dependency across multiple repos and open PRs (captured 2026-04-23)"

defaults:
  org: "myorg"
  repos: ["repo1", "repo2", "repo3", "repo4", "repo5"]
  dep_name: "orchstep"
  old_version: "1.5.0"
  new_version: "1.6.1"
  branch: "auto/bump-{{ vars.dep_name }}-{{ vars.new_version }}"
  workdir: "/tmp"

tasks:
  main:
    desc: "Loop over repos, apply bump, open PR for each"
    steps:
      - name: process_each_repo
        loop: "{{ vars.repos }}"
        as: repo
        on_error: continue        # If one repo fails, continue to next
        collect_errors: true      # Aggregate failures for final report
        task: bump_one
        with:
          repo: "{{ repo }}"

      - name: report_results
        func: shell
        do: |
          echo "Processed {{ len vars.repos }} repos"
          echo "Failures: {{ len steps.process_each_repo.errors }}"

      - name: assert_majority_succeeded
        func: assert
        args:
          condition: 'steps.process_each_repo.errors.length < vars.repos.length / 2'
          desc: "Goal: at least half the repos must succeed (loose threshold)"

  bump_one:
    desc: "Clone, bump dep, commit, push, PR for one repo"
    vars:
      repo_path: "{{ vars.workdir }}/{{ vars.repo }}"
    steps:
      - name: clone
        func: shell
        do: |
          rm -rf {{ vars.repo_path }}
          git clone "https://github.com/{{ vars.org }}/{{ vars.repo }}.git" {{ vars.repo_path }}
        retry:
          max_attempts: 3
          interval: 3s

      - name: branch
        func: shell
        do: |
          cd {{ vars.repo_path }} && git checkout -b {{ vars.branch }}

      - name: edit
        func: shell
        do: |
          cd {{ vars.repo_path }}
          sed -i '' 's/{{ vars.dep_name }}@{{ vars.old_version }}/{{ vars.dep_name }}@{{ vars.new_version }}/' package.json

      - name: commit_push
        func: shell
        do: |
          cd {{ vars.repo_path }}
          git add package.json
          git commit -m "chore: bump {{ vars.dep_name }} to {{ vars.new_version }}"
          git push origin {{ vars.branch }}
        retry:
          max_attempts: 3
          interval: 3s

      - name: open_pr
        func: shell
        do: |
          cd {{ vars.repo_path }}
          gh pr create \
            --title "Bump {{ vars.dep_name }} to {{ vars.new_version }}" \
            --body "Auto-generated bump from {{ vars.old_version }} to {{ vars.new_version }}" \
            --head {{ vars.branch }}
        retry:
          max_attempts: 3
          interval: 3s
```

`workflows/bump_dep_across_repos.envrc.example`:

```bash
# .envrc.example — env vars required to replay this workflow
# 1. Copy: cp bump_dep_across_repos.envrc.example bump_dep_across_repos.envrc
# 2. Fill: edit bump_dep_across_repos.envrc
# 3. Source: source bump_dep_across_repos.envrc
# 4. Run: orchstep run bump_dep_across_repos
#
# IMPORTANT: Add `.envrc` to your .gitignore.

# Secrets — required for git push and gh CLI
export GITHUB_TOKEN="<your-token-here>"
```

## Design Rationale

**Why loop + sub-task:**
The captured session shows the SAME pattern repeated 5 times. Loop is the canonical OrchStep way to express this. Sub-task (`bump_one`) keeps each iteration's logic readable and reusable.

**`on_error: continue` + `collect_errors`:**
The user implicitly tolerated partial failure (got 5 PRs out of 5, but if one had failed, they'd have wanted the others to still succeed). The aggregation pattern surfaces failures without aborting the whole loop.

**Why `assert_majority_succeeded` instead of `assert all succeeded`:**
Loose threshold reflects realistic intent. A strict "all must pass" assertion would fail the workflow on any one repo failure, which contradicts the `on_error: continue` semantic. The skill chose a loose assertion to match the loop tolerance. User can tighten to `=== vars.repos.length` if they want strict.

**Variables extracted:**
- `org`, `repos` (list), `dep_name`, `old_version`, `new_version`, `branch`, `workdir` — every parameterizable dimension
- The `branch` value is COMPOSED from other vars (`auto/bump-{{ vars.dep_name }}-{{ vars.new_version }}`), demonstrating var composition

**Env vars:**
- `GITHUB_TOKEN` — required by both `git push` (when using HTTPS) and `gh` CLI. Detected as secret by name pattern.

**What got retries:**
- `clone`, `commit_push`, `open_pr` — all involve network calls
- `edit` does NOT retry (local file op, deterministic)
- `branch` does NOT retry (local git op, deterministic)

**The user's signal-driven retry:**
The user mentioned "one git push failed, retry succeeded" — this confirms `git push` retry is justified by session evidence.

**Module suggestion:** None — multi-repo PR opening is too custom for any core module.

**Replay value:**
- `orchstep run bump_dep_across_repos` — re-runs across the same 5 repos
- `orchstep run bump_dep_across_repos --var new_version=1.7.0` — bumps to a NEW version
- `orchstep run bump_dep_across_repos --var repos='["repo6","repo7"]'` — different repo set

The workflow is now a reusable "bump + PR" template.
