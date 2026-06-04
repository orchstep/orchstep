# Wizard: Intent-Driven Design

The wizard is used when the user's request is vague, they ask for help
designing their workflow, or the skill decides their request would benefit
from exploration before production. It is never a scripted interview — each
question is worded naturally based on what the user has already revealed.

## Intent Dimensions

The LLM evaluates these dimensions to decide what to ask. If a dimension
is already answered by the user's initial message, skip it. If only half
answered, ask a focused follow-up — not the full dimension.

### trigger_and_scope

What starts this workflow and where does it go?

Signals the dimension is answered:
- User named an event: "on every git push," "when a PR is merged"
- User described a schedule: "daily at 2am," "every Monday"
- User named a target: "deploy to staging," "provision an S3 bucket"

If not answered, ask:
"Walk me through what triggers this — is it a one-time task, a recurring
routine, or triggered by something specific like a deploy or a webhook?"

### environment_strategy

How many environments and how are they configured?

Signals answered:
- "dev/staging/prod with promotion gates"
- "single environment, just production"
- "per-branch preview environments"
- References `env_groups:` or `environments:`

If not answered, ask:
"Will this workflow run in multiple environments, or is it single-target?"

### complexity_and_flow

Is the workflow linear, parallel, conditional, or does it loop?

Signals answered:
- "build all platforms in parallel"
- "deploy sequential — build, test, then promote"
- "conditional — only deploy if tests pass"
- User mentions `parallel:`, `loop:`, `if:`, `switch:`

If not answered, ask:
"Walk me through the sequence of steps — is it a simple pipeline, or
does it have branches, parallel work, or conditional stages?"

### error_and_reliability

How many failures can the workflow tolerate before someone notices?

Signals answered:
- "needs automatic retry with backoff"
- "rollback on failure"
- "alert if deploy fails"
- "non-critical steps should warn not fail"

If not answered, ask:
"Is it OK for this workflow to stop on the first failure, or should
some steps be allowed to warn-and-continue?"

### human_interaction

Does a human need to review or approve anything mid-workflow?

Signals answered:
- "approval gate before production"
- "prompt for environment selection"
- "no prompts — fully automated"

If not answered, ask:
"Does anyone need to approve a step before the workflow proceeds —
or is it fully automated from start to finish?"

### reuse_and_modules

Will someone else want this workflow — or similar ones built from it?

Signals answered:
- "extract this into a shared module for the team"
- "just a one-off deploy script"
- References `modules:` or a module registry

If not answered, ask:
"Is this a standalone workflow for your project, or something you'd
want to package as a reusable module for your team?"

## Question Generation Rules

1. Each question is one at a time — never batch.
2. Generate natural, specific wording — not canned. Use concrete
   examples from what the user already said.
3. If the user sounds confident on a dimension, skip it. If they
   hesitate, offer 2-3 options as multiple choice.
4. After 3-4 questions (intent dimensions are covered), produce the
   workflow. The user does NOT need to answer all 6.
5. If the user says "just build it," skip all remaining dimensions
   and produce the workflow immediately.

## Output Generation

After the intent pass, produce:

1. The workflow YAML in full — no placeholders, no "..." sections
2. A brief explanation of WHY each pattern was chosen:
   "- retry with backoff on the health check because..."
   "- parallel execution on builds because..."
   "- manual approval gate before production because..."

If the user clearly wants a quick answer (they gave a concrete task
name), skip the wizard entirely and produce the workflow directly
using references/*.md for knowledge.