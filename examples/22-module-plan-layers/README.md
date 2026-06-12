# 22 - Module Plan Layers

Three module layers planned by `--dry-run` (v0.9.0+): the app workflow
calls a `deployer` module, which itself imports and calls a `notifier`
module. The plan descends all of it with engine-faithful scoping - the
module's own defaults, the import's `config:` overrides, and rendered
`with:` parameters all resolve, so the inner commands appear exactly as
they would run.

```
orchstep.yml                          # storefront release (layer 1)
└── modules/deployer/                 # platform deploy module (layer 2)
    └── modules/notifier/             # notification module (layer 3)
```

```bash
orchstep run release --dry-run        # plan all three layers
orchstep run release --dry-run --open # visual plan (PLAN/GRAPH tabs)
orchstep run release                  # real run - all echoes, compare!
```

Things to notice in the plan: `strategy_gate` resolves to canary because
the import's `config: strategy: "canary"` overrides the module default
(`rolling`); the layer-3 notification renders `[#deploys]` from the
nested module's config. Live rendered plan:
https://orchstep.dev/dryrun/example-module-plan.html
