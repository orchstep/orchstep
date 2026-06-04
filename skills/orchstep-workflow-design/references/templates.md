# Template Expressions Reference

OrchStep uses Go templates (text/template + Sprig function library), with
Goja (JavaScript) for `transform` steps. This reference covers the template
engine used in `{{ ... }}` expressions throughout the workflow.

## Syntax

```
{{ vars.env }}                          — variable interpolation
{{ eq vars.env "production" }}          — equality comparison
{{ steps.build.output }}                — step output access
{{ env.PATH }}                          — OS environment variable
{{ stdin }}                             — piped stdin data
```

## Sprig Functions

Sprig provides 70+ template functions. The most commonly useful ones:

| Function | Usage |
|----------|-------|
| `eq`, `ne`, `lt`, `gt`, `le`, `ge` | Comparisons |
| `and`, `or`, `not` | Boolean logic |
| `contains` | String contains: `{{ contains "hello" "ell" }}` |
| `hasPrefix`, `hasSuffix` | String prefix/suffix check |
| `upper`, `lower`, `title` | Case transforms |
| `trim`, `trimPrefix`, `trimSuffix` | String trimming |
| `regexFind`, `regexMatch` | Regex extraction/matching |
| `regexFind "IMAGE=(.+)" result.output` | Capture group extraction |
| `split`, `join` | String split/join |
| `default` | Default value: `{{ default "staging" vars.env }}` |
| `ternary` | Inline if: `{{ ternary "prod" "dev" (eq vars.env "production") }}` |
| `toJson`, `fromJson` | JSON serialization/deserialization |
| `toYaml`, `fromYaml` | YAML serialization/deserialization |
| `len` | Array/string length |
| `first`, `last`, `rest`, `append`, `prepend` | List operations |
| `uniq` | Deduplicate list |
| `dict` | Build key-value map |

## Common Expression Patterns

### Conditional in assert
```yaml
condition: '{{ eq steps.build.status "success" }}'
```

### Output extraction
```yaml
outputs:
  image: '{{ result.output | regexFind "IMAGE=([^\\s]+)" }}'
```

### Default fallback
```yaml
condition: '{{ ne (default "" steps.build.image) "" }}'
```

### Ternary inline
```yaml
args:
  url: "https://{{ ternary vars.hostname hostname }}.example.com/api"
```

### JSON output parsing
```yaml
condition: '{{ eq (fromJson steps.api_call.result).status "ok" }}'
```

## JavaScript Expressions

`func: transform` uses Goja (JavaScript VM) with ES5+ syntax. For complex
transformations that Sprig's template pipes can't express cleanly:

```yaml
- name: calculate
  func: transform
  do: |
    let scores = data.historical;
    return {
      name: data.name,
      avg: scores.reduce((a,b) => a + b, 0) / scores.length,
      tags: data.tags.filter(t => t.startsWith("prod-"))
    };
```

Access template variables in transform: `vars.X`, `steps.X.Y`, `env.X`.

## Important Rules

- ALWAYS single-quote template strings in YAML that contain `{{`:
  `condition: '{{ eq x y }}'` not `condition: "{{ eq x y }}"`
- The pipe character `|` is a Sprig function chaining operator, not a
  shell pipe. Inside `{{ }}` it chains template transforms.
- `regexFind` matches the FIRST capture group `(...)`. If you need the
  full match, wrap the whole pattern: `{{ regexFind "(pattern)" str }}`.
- Escape backslashes in regex: `\s` → `\\s` in quoted YAML strings.