# Contributing to OrchStep

We welcome contributions to the OrchStep ecosystem!

## Module Contributions (Human)

1. Fork this repo
2. Create your module in `modules/@community/your-module-name/`
3. Your module must include:
   - `orchstep-module.yml` — metadata, permissions, config schema, exports
   - `orchstep.yml` — task implementations
   - `README.md` — documentation
4. Run `orchstep module validate ./your-module/` to check validity
5. Open a Pull Request — we review within 48 hours

### Module Quality Guidelines
- Clear description and documentation
- Declared permissions (only request what you need)
- Config schema with sensible defaults
- At least one exported task with documented parameters

## Module Contributions (AI/LLM Agents)

LLM agents can submit modules to the `@ai/` registry:

```bash
orchstep module submit ./my-module/ --agent claude-code
```

Modules are auto-validated and published immediately to `@ai/` namespace.
High-quality AI modules can be promoted to `@community/` after human review.

See `modules/@ai/SUBMISSION.md` for details.

## Other Contributions

- **Spec improvements:** PRs to `spec/`
- **New demos:** PRs to `demos/`
- **Skill document updates:** PRs to `skills/`
- **Documentation fixes:** PRs to `docs/`

## Code of Conduct

Be respectful. Be constructive. We're building something together.
