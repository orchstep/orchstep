# Example 08: No Clear Task (Graceful Refusal)

This example shows what the skill should do when there's NO meaningful work to capture, OR when the scope is genuinely ambiguous. Refusing well is just as important as capturing well.

## Scenario A: No Substantive Work

### The Session

User in Claude Code spent 20 minutes asking questions and reading files:

```
User: What does this auth middleware do?
Claude: <reads auth.go, explains>
User: Where is the session expiry handled?
Claude: <greps, points to line 47>
User: Are there tests for this?
Claude: <lists tests>
User: How does the JWT validation work in detail?
Claude: <reads jwt.go, explains>
```

No bash commands run for actual work. No edits. No commits. Just exploration.

User: `/orchstep-capture auth_investigation`

### The Skill's Response

Refuse politely, explain why, give next-step guidance:

```
I don't see substantive work to capture in this session — looks like
read-only exploration (file reads, grep, conceptual questions).

OrchStep workflows capture WORK (commands run, files changed, things
produced). Investigation sessions don't have that shape.

If you want to:
- Capture the investigation as documentation → consider writing a
  markdown summary instead, not a workflow
- Capture a future remediation → do the work first, then run
  /orchstep-capture <name>
- Save the questions you asked as a reusable prompt → that's a
  different tool (Claude Code skill or prompt library)

No file written.
```

**Skill exits gracefully. No YAML emitted. No false positive.**

## Scenario B: Ambiguous Scope (Multiple Recent Tasks)

### The Session

User did THREE different things in the last 30 minutes:
1. Fixed a bug in the auth middleware
2. Set up monitoring for the new service
3. Wrote a small backfill script

User: `/orchstep-capture recent_work`

### The Skill's Response

Ask ONE clarifying question, then proceed:

```
I see three recent tasks:
  (A) The auth middleware bug fix
  (B) The new service monitoring setup
  (C) The backfill script

Which one should I capture? (Type A, B, C, or "all" to capture them as
a single workflow with three sub-tasks.)
```

Wait for user response, then proceed with the chosen scope.

## Scenario C: Empty Description

### The Session

User just opened Claude Code, hasn't done anything yet.

User: `/orchstep-capture quick_thing`

### The Skill's Response

```
There's nothing in the recent session to capture yet. Run the work first
(e.g., the deploy, the script, the fix), then come back and run
/orchstep-capture quick_thing to capture what you did.

Tip: if you know what you want to capture in advance, you can describe
it: /orchstep-capture quick_thing "the deploy I'm about to do" — and
I'll watch for the relevant signals.
```

## Scenario D: Validation Failure That Can't Be Auto-Fixed

### The Session

User ran a complex captured session involving an experimental OrchStep feature that doesn't quite parse correctly.

After the skill emits the YAML, `orchstep validate` fails. The skill attempts one auto-fix pass. Validation still fails.

### The Skill's Response

Write the YAML anyway with a clear warning header:

```yaml
# CAPTURED WITH WARNINGS
# Validation error: step 'experimental_thing': unsupported func 'newfeature'
# This workflow was captured from your session but did not pass orchstep validate.
# Fix the issue manually before running: orchstep run <name>
# See: orchstep validate workflows/<name>.yml --format json for full details

name: <name>
...
```

Then in the report to user:

```
⚠ Captured workflow: workflows/<name>.yml
⚠ Validation: FAILED after 1 auto-fix attempt
✓ Env template: workflows/<name>.envrc.example

Specific error:
  step 'experimental_thing': unsupported func 'newfeature'

The workflow was written to disk anyway with a CAPTURED WITH WARNINGS
header. Review and fix before running.

Detailed error: orchstep validate workflows/<name>.yml --format json
```

## Design Rationale

**Why graceful refusal matters:**

Captured workflows are valuable artifacts. A workflow that doesn't make sense, or one that captures nothing, erodes user trust. Better to refuse with clear guidance than emit a confusing or empty YAML.

**The four scenarios above cover ~90% of "non-happy-path" invocations:**
1. **No work** → refuse, explain
2. **Ambiguous scope** → ask one clarifying question
3. **Empty session** → tell user to do the work first
4. **Validation failure** → write with warning, never silently fail

**Common patterns in graceful refusal:**
- Explain WHAT was detected (or not detected)
- Explain WHY this isn't a good capture
- Suggest the right next step
- Never write a partial/junk YAML without a `# CAPTURED WITH WARNINGS` header
- Use plain language — the user is probably surprised by the refusal

**One question, not five:**
When asking for clarification, ask ONE question. Multi-part questions break the flow. If more clarification is needed after the first answer, ask the next one — but rarely should this be needed.

**No retry storms:**
The skill must not loop endlessly trying to figure out scope. ONE clarifying question, then proceed with what was given. If the user's answer is still unclear, default to the most recent task and report what was assumed.

**Anti-patterns:**
- Generating a workflow with one step that says "echo nothing happened" (junk output)
- Asking 5 clarifying questions before doing anything (annoying)
- Silently writing a broken YAML (erodes trust)
- Refusing without explaining why (frustrating)
- Emitting a "CAPTURED WITH WARNINGS" workflow without telling the user (silent failure)
