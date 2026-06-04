# Control Flow Reference

## Conditionals (if)

```yaml
- name: deploy
  func: shell
  if: '{{ eq vars.env "production" }}'
  do: echo "Production deploy!"
```

Uses Go template expressions. Available helpers: `eq`, `ne`, `lt`, `gt`, `and`, `or`, `not`, `contains`, `regexMatch`.

## If/Elif/Else Blocks

```yaml
- name: route
  if: '{{ eq vars.env "production" }}'
  then:
    - task: deploy_prod
  elif:
    - if: '{{ eq vars.env "staging" }}'
      then:
        - task: deploy_staging
  else:
    then:
      - task: deploy_dev
```

- `then:` is always a list of steps
- `else:` requires a `then:` wrapper (can't be inline)
- Multiple `elif:` branches are supported
- `if:` inside steps also works (`if` → `then` → `elif` → `else`)

## Switch/Case

```yaml
- name: route
  switch:
    value: '{{ vars.env }}'
    cases:
      - when: production
        task: deploy_prod
      - when: staging
        task: deploy_staging
    default:
      - task: deploy_dev
```

- `value:` evaluates as a template
- `when:` values are compared literally
- `default:` is optional
- Each case can be a single task call (shown) or a list of steps

## Loops

Loop over a static list:

```yaml
- name: deploy_all
  func: shell
  loop: [us-east-1, eu-west-1, ap-southeast-1]
  do: echo "Deploying to {{ loop.item }}"
```

Loop variables:
- `loop.item` — current value
- `loop.index` — 0-based index
- `loop.i` — 1-based index
- `loop.first` — true on first iteration
- `loop.last` — true on last iteration
- `loop.length` — total items

Loop over a range:

```yaml
- name: run_batches
  func: shell
  loop: { count: 5 }
  do: echo "Batch {{ loop.i }}"
```

Loop with conditional:

```yaml
- name: filter
  if: '{{ ne loop.item "" }}'
  func: shell
  loop: ["a", "", "b"]
  do: echo "{{ loop.item }}"
```

Loop over named items:

```yaml
- name: deploy_all
  func: shell
  loop: ["us-east-1", "eu-west-1", "ap-southeast-1"]
  do: echo "Deploying to {{ loop.item }}"
```

## Calling tasks in a loop

```yaml
- name: deploy-envs
  loop: ["staging", "production"]
  task: deploy_single
  with:
    environment: "{{ loop.item }}"
```

## Parallel Execution

```yaml
- name: parallel_tasks
  parallel:
    - name: build_linux
      func: shell
      do: make build-linux

    - name: build_macos
      func: shell
      do: make build-macos

    - name: build_windows
      func: shell
      do: make build-windows
```

- All children run concurrently
- If any child fails, remaining children are NOT cancelled by default
- Use `on_error: fail` on parallel children to stop all on first failure
- `finally:` runs regardless of parallel success/failure
- Step outputs from parallel children accessed individually by name