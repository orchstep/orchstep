# vhs tape — orchstep-capture demo: Go calculator
# Render with: ./record.sh   (sets DEMO_DIR and runs vhs)
#
# Two-act structure:
#   Act 1 — Fake Claude REPL: user types prompt, canned "Claude" output streams.
#   Act 2 — `/orchstep-capture` echoes confirmation, then real `orchstep run` replays.

Output capture-demo.gif

Set Shell "zsh"
Set FontSize 14
Set Width 1200
Set Height 720
Set Theme "Catppuccin Mocha"
Set TypingSpeed 35ms
Set PlaybackSpeed 1.0

# ---------- Setup (hidden) ----------
Hide
Type "cd $(mktemp -d)"
Enter
Type "cp $DEMO_DIR/fake_claude.sh ./claude && chmod +x ./claude"
Enter
Type "cp $DEMO_DIR/captured.orchstep.yml ./orchstep.yml"
Enter
Type "setopt INTERACTIVE_COMMENTS"
Enter
Type "clear"
Enter
Show

# ---------- Act 1: Claude Code session (fake REPL) ----------
Type "./claude"
Sleep 200ms
Enter
Sleep 800ms

Type "Build me a tiny Go calculator: Sum(a,b int) int + table-driven tests."
Sleep 500ms
Enter
Sleep 4500ms

# ---------- Act 2: /orchstep-capture ----------
Type "/orchstep-capture"
Sleep 400ms
Enter
Sleep 2500ms

# Show the captured workflow
Type "clear"
Enter
Type "cat orchstep.yml | head -25"
Enter
Sleep 3000ms

# ---------- Act 3: live replay ----------
Type "clear"
Enter
Type "# Replay the captured workflow — fresh terminal, no LLM, deterministic."
Enter
Sleep 600ms
Type "orchstep run"
Sleep 400ms
Enter
Sleep 6000ms

# Hold final frame
Sleep 2000ms
