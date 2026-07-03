# Patterns Cookbook — env, env groups, env variables, modules

Copy-paste recipes for the four things people reach for most. Each has a one-line
"when." For full field semantics see `variables.md`, `modules.md`, `syntax.md`.

## Terminology (don't conflate)

- **Application variables** = the `{{ vars.X }}` namespace: `defaults:`, task/step
  `vars:`, `env_groups:`/`environments:`, `--var`. Merged into one `vars` namespace.
- **OS environment variables** = the `{{ env.X }}` / `$X` shell environment: `env:`,
  `dotenv:`, secrets. Separate from `vars`.
- **Environment (a group/profile)** = a named set selected with `--env` (e.g. `prod`).

---

## A. OS environment variables (`env:` / `dotenv:` / secrets)

**Inject a value (workflow/task/step `env:`):** when a command needs an env var set.
```yaml
tasks:
  deploy:
    env: { REGION: "{{ vars.region }}" }      # templated
    steps: [ { func: shell, do: 'aws configure set region "$REGION"' } ]
```

**Load from a file (`dotenv:`):** when values live in a `.env`/`.envrc`.
```yaml
dotenv: [common.env, "deploy_{{ vars.environment }}.env?"]  # "?" = optional; templated
```

**Require, don't set (`<required>`):** when a value MUST come from the OS/CI, fail fast.
```yaml
env: { API_TOKEN: "<required>" }             # errors at load if unset
```

**Secret (conduit, not vault):** resolved into the env, scrubbed from logs.
```yaml
secrets: { DB_PASS: { cmd: "vault kv get -field=pass secret/db" } }
steps: [ { func: shell, do: 'psql "postg://u:${DB_PASS}@h/db"' } ]  # {{ secrets.X }} in templates
```

**Scoped / batteries-included:** a called task's `env:`/`dotenv:` load for it and
**unwind on return** — no leak to the caller or siblings. Caller `env:` overrides.
```yaml
tasks:
  smoke: { dotenv: [staging.env], steps: [ { func: shell, do: 'run-smoke' } ] }  # DATABASE_URL local to smoke
  main:  { steps: [ { task: smoke }, { task: deploy_prod } ] }  # deploy_prod won't inherit it
```

---

## B. Application vars per environment (env groups / environments)

**Inline groups + environments:** when a few environments share tiers (nonprod/prod).
```yaml
defaults: { replicas: 1, log_level: info }
env_groups:  { prod: { vars: { replicas: 6, log_level: warn } } }
environments:{ prod-eu: { group: prod, vars: { region: eu } } }
# orchstep run deploy --env prod-eu   ->  replicas=6, region=eu
```
Resolution: Step > Task > Environment > Group > Defaults.

**External `environments/` files:** when config is large or structured. Auto-discovered
beside the workflow; layered `defaults.yml` → `<group>.yml` → `<group>-<env>.yml`;
values can be whole objects.
```
environments/defaults.yml   # resources: { cpu: "250m" }
environments/prod.yml        # resources: { cpu: "2" }   (group)
environments/prod-eu.yml     # region: eu                (environment)
```
```yaml
- func: shell
  do: 'helm upgrade app --set cpu={{ vars.resources.cpu }} --set region={{ vars.region }}'
```

**Ad-hoc against an environment (no task):** see `adhoc-commands.md`.
```bash
orchstep do --env prod-eu 'echo deploying to {{ vars.ingress.host }}'
```

---

## C. Modules (library vs configured instance)

**Library call — caller drives (Inherited, default):** reusable logic, you pass inputs.
```yaml
- { module: notifier, task: send, with: { message: "starting" } }
```

**Configured instance — module owns its config (`instance_profile`):** the module
loads its OWN `environments/<profile>` + dotenv + env. No config in the caller.
```yaml
- { module: billing, task: deploy, instance_profile: prod }
```

**Fleet fan-out (`@caller`):** one `--env` drives every module to its matching profile.
```yaml
- { module: billing,  task: deploy, instance_profile: "@caller" }
- { module: checkout, task: deploy, instance_profile: "@caller" }
# orchstep run ship --env prod  ->  each loads its OWN environments/prod
```

**Pinned (`isolate: true`) for the money path:** exactly the module's profile,
clean-room — nothing from the caller can perturb it (audit-friendly).
```yaml
- { module: checkout, task: deploy, instance_profile: prod, isolate: true }
```

**Sealed (`isolate` + no profile):** a self-contained tool on its own baseline,
independent of where it's called (a linter, a backup job).
```yaml
- { module: backup, task: run, isolate: true }
```

Bundled context (`environments/`/`dotenv:`/`env:`) loads only in a non-Inherited mode
and is scoped — instances stay independent and nothing leaks back. Full table:
`modules.md` → context modes.

---

## Choosing quickly

| Need | Reach for |
|------|-----------|
| A shell var set for a command | `env:` (templated) |
| Values from a file, maybe per-profile | `dotenv:` (with `?`, templated) |
| A value CI must provide | `env: X: <required>` |
| A password/token | `secrets:` |
| Different app config per environment | `env_groups:`/`environments:` or `environments/` files |
| Structured config (objects) per env | external `environments/` files |
| Reuse another team's logic, you own inputs | module call with `with:` |
| A service that owns its own per-env config | module + `instance_profile:` |
| Deploy the whole fleet with one `--env` | module + `instance_profile: "@caller"` |
| Run one command with the right context | `orchstep do` (see adhoc-commands.md) |
