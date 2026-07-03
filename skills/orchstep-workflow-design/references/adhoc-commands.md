# Ad-hoc Commands Reference (`orchstep do` / OrchShell)

`orchstep do` runs any shell command or script with your OrchStep context already
filled in — `{{ vars.X }}` / `{{ env.X }}` resolved from `defaults`, environment
groups/environments (`--env`), and `dotenv` — then executes the result. Output is
bare passthrough and the command's real exit code is propagated, so it drops into
scripts and pipelines. It is the ad-hoc counterpart to `orchstep run` (like
`ansible -m shell` next to `ansible-playbook`), and the *execute* sibling of
`orchstep eval` (which only renders a value).

## Four input modes

```bash
# 1. Inline — the one-off. Quote the whole command.
orchstep do 'kubectl set image deploy/app app={{ vars.image }}'

# 2. Stdin / pipe — render and run a whole script.
cat deploy.sh | orchstep do --env prod

# 3. Script file (+ positional args). Works as a shebang:
orchstep do --script ./deploy prod canary       # $1=prod $2=canary
#   #!/usr/bin/env -S orchstep do --script
#   echo "Deploying v{{ vars.version }} to {{ vars.region }}"

# 4. Interactive stateful REPL — no command + a TTY.
orchstep do --env prod
#   vars stay constant; cd/export/multi-line persist across lines like a real shell.
```

## Flags

| Flag | Effect |
|------|--------|
| `--env <name>` | Select environment group/environment (same as `run`) |
| `--var k=v`, `--vars-file f` | Runtime var overrides |
| `--render` | Print the fully-resolved command WITHOUT running it (context-aware `envsubst`) |
| `-f <file>` | Use a specific workflow file for context |
| `--script <path>` | Treat the path as a script; remaining args become `$1`, `$2`, … |

Always `--render` first for anything destructive:
```bash
orchstep do --render --env prod 'flyctl deploy --image {{ vars.image }}'
# flyctl deploy --image registry/app:1.2.3
```

## OrchShell: no `orchstep.yml` required

Pointed at a directory with no workflow file, `orchstep do` discovers **ambient
context**: a conventional `environments/` directory (rich per-environment vars,
including whole objects, layered by group) and the `dotenv:` declared in an
`orchstep_config.yml`. That's **OrchShell** — dotenv++ for applications: your
*commands* get structured, per-env config, not just flat strings.

```bash
orchstep do --env prod-eu 'helm upgrade checkout --set cpu={{ vars.resources.cpu }} \
  --set host={{ vars.ingress.host }}'
```

A stray `.env` is **not** auto-loaded — dotenv must be declared (a trust boundary),
so an untrusted directory can't slip env vars into your commands.

## Notes

- Secrets resolve into the environment (referenced as `$X`), never rendered into the
  command text — so `--render` won't leak them.
- Promote anything you run repeatedly (or want reviewed) to a task in `orchstep.yml`;
  `do` is for the ad-hoc and exploratory.
- Deep dive: https://orchstep.dev/learn/ad-hoc-commands and https://orchstep.dev/learn/orchshell
