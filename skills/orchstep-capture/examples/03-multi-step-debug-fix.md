# Example 03: Multi-Step Debug + Fix + Verify

## The Session

User in Claude Code:

> "There's a bug in the auth middleware that drops requests when the session expires. Reproduce, fix, verify."

Claude ran:

```bash
# Reproduce
cd /Users/dev/myapp
go test ./internal/auth -run TestSessionExpiry -v
# FAIL — confirmed

# Investigate
grep -rn "session.expired" internal/auth/
# Found auth.go:47 returning nil instead of error

# Fix (Claude edited auth.go)
# (Edit tool call: changed line 47 from `return nil` to `return ErrSessionExpired`)

# Verify
go test ./internal/auth -run TestSessionExpiry -v
# PASS

# Run broader tests
go test ./internal/auth/... -v
# all PASS

# Lint
go vet ./internal/auth/...
# clean
```

User said "ship it" and committed.

## The Captured YAML

`workflows/fix_session_expiry.yml`:

```yaml
name: fix_session_expiry
desc: "Reproduce, fix, and verify the session expiry auth middleware bug (captured 2026-04-23)"

defaults:
  package: "./internal/auth"
  failing_test: "TestSessionExpiry"
  fix_file: "internal/auth/auth.go"
  fix_line: "47"

tasks:
  main:
    desc: "Reproduce the failing test, apply the fix, verify"
    steps:
      - name: reproduce_failure
        func: shell
        do: |
          go test {{ vars.package }} -run {{ vars.failing_test }} -v
        on_error: warn          # Reproduction is expected to fail before the fix

      - name: apply_fix
        func: shell
        do: |
          # Manual fix: change line {{ vars.fix_line }} of {{ vars.fix_file }}
          # FROM: return nil
          # TO:   return ErrSessionExpired
          #
          # NOTE: This step is a placeholder for the actual code change.
          # The captured session edited the file directly. To re-apply:
          # Option A: commit the fix to git, then this step does `git checkout <ref>`
          # Option B: keep the fix as a patch file, apply with `patch -p1 < fixes/session-expiry.patch`
          # Option C: leave manual — review and edit before re-running
          echo "Apply fix to {{ vars.fix_file }}:{{ vars.fix_line }}"

      - name: verify_specific_test
        func: shell
        do: |
          go test {{ vars.package }} -run {{ vars.failing_test }} -v

      - name: assert_specific_passes
        func: assert
        args:
          condition: '{{ eq steps.verify_specific_test.exit_code 0 }}'
          desc: "Goal: the previously-failing test must now pass"

      - name: verify_full_package
        func: shell
        do: |
          go test {{ vars.package }}/... -v

      - name: assert_full_passes
        func: assert
        args:
          condition: '{{ eq steps.verify_full_package.exit_code 0 }}'
          desc: "Goal: full package tests must pass — no regressions"

      - name: lint
        func: shell
        do: |
          go vet {{ vars.package }}/...
        on_error: warn          # Don't block on lint warnings
```

`workflows/fix_session_expiry.envrc.example`:

```bash
# No env vars or secrets detected.
```

## Design Rationale

**The hard part of capturing a debug-fix session:** The actual code edit can't always be expressed in YAML. The user used the Edit tool to change a Go file. There are three reasonable ways to handle this in the captured workflow:

1. **Reference a committed fix** — the captured workflow assumes the fix is in git already, just runs the verify steps
2. **Reference a patch file** — extract the diff, save as a patch, apply during replay
3. **Document manual fix** — placeholder step that explains what to change, requires manual action on replay

The captured YAML uses Option C (placeholder + comment) because it's the safest default. The skill leaves a clear note for the user to choose A or B if they want full automation.

**Why `on_error: warn` on the reproduce step:**
The reproduction step is EXPECTED to fail initially (that's the point). We don't want the workflow to halt there. Setting `on_error: warn` lets the workflow continue to the fix and verify steps.

**Two assertions:**
- `assert_specific_passes` — confirms the targeted bug is fixed
- `assert_full_passes` — confirms no regressions

This is the pattern for bug-fix workflows: narrow assertion + broad assertion.

**What got extracted to `defaults:`:**
- `package`, `failing_test`, `fix_file`, `fix_line` — the user can re-use this workflow shape for OTHER bug fixes by just changing the vars

**Module suggestion:** None — debug-fix workflows are too project-specific for any current core module.

**Replay value:**
This workflow doesn't fully auto-replay — the manual fix step requires user action. But it makes the REGRESSION CHECK reproducible: anyone can run the verify steps to confirm the bug stays fixed.

For a future capture skill or a hardened version: detecting code edits and saving them as patches automatically would close the loop. Add to `orchstep-harden` roadmap.
