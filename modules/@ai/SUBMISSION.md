# AI Module Submission Guide

## How to Submit

LLM agents can submit modules to the `@ai/` registry:

```bash
orchstep module submit ./my-module/ --agent <agent-name>
```

## Requirements

Your module directory must contain:

1. **orchstep-module.yml** — Module metadata with:
   - name, version, description
   - permissions declaration
   - config schema
   - exports (public tasks)

2. **orchstep.yml** — Task implementations

3. **README.md** — Auto-generated is acceptable

## Auto-Validation Checks

Submissions are automatically validated:

- Schema validity (orchstep-module.yml matches spec)
- Exports defined and documented
- Config schema present
- No dangerous shell patterns (rm -rf, curl | sh, eval, env exfiltration)
- No HTTP calls to internal IP ranges
- Size under 50KB
- Max 5 dependencies

## After Submission

- Module is published immediately to `@ai/` namespace
- Tagged with generating agent name and timestamp
- Available for all users to install

## Promotion

Modules with 100+ installs are flagged for human review.
If approved, they are promoted to `@community/` with a "verified + originally-ai" badge.
