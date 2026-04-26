# Go Calculator — orchstep-capture Demo

Showcase for `/orchstep-capture`: Claude Code builds a tiny Go package
end-to-end, the skill compresses the session into a replayable
`orchstep.yml`, and the workflow re-runs deterministically with no LLM.

## Files

- `PROMPT.md` — paste this into a fresh Claude Code session to drive the
  demo manually.
- `captured.orchstep.yml` — the workflow `/orchstep-capture` should produce.
  Verified end-to-end with `orchstep run -f captured.orchstep.yml`.
- `demo.tape` — vhs script that renders the GIF (reenacts the Claude
  session, then runs the captured workflow live for proof).
- `record.sh` — one-shot automation: installs vhs if needed, renders
  `capture-demo.gif`.

## Generate the GIF

```bash
./record.sh
```

Produces `capture-demo.gif` (~18s, single loop) in this directory.

## Run the captured workflow standalone

```bash
orchstep run -f captured.orchstep.yml
```

Requires: Go on PATH. No network. Creates and tears down `./calc-demo`.
