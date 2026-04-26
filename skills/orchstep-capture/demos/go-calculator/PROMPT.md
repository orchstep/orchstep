# Go Calculator — Capture Demo Prompt

Paste this prompt into a fresh Claude Code session inside an empty directory.
Claude will build a small Go calculator end-to-end. When it finishes, run
`/orchstep-capture` to compress the whole session into a replayable workflow.

---

## Prompt to paste

```
Build me a tiny Go "calculator" package, step by step. Run every command
yourself and show output as you go.

1. Initialize a Go module named `calculator` in the current directory.
2. Create `calculator.go` with a single exported function:
       func Sum(a, b int) int
   that returns a + b.
3. Create `calculator_test.go` with table-driven tests covering:
       - 2 + 3 = 5
       - -1 + 1 = 0
       - 0 + 0 = 0
   Use the standard `testing` package, no external deps.
4. Run `go test -v ./...` and show me the output.
5. Run `go vet ./...` to confirm the package is clean.
6. Print a one-line summary: module name, function signature, test count,
   pass/fail.

Do not ask clarifying questions — just execute. Stop after step 6.
```

---

## After Claude finishes

Run:

```
/orchstep-capture
```

Expected output: a clean `orchstep.yml` with ~6 steps (mod init, write
calculator.go, write test, `go test`, `go vet`, summary), all replayable
with `orchstep run` on any machine that has Go installed.
