# 20 - Remote Modules

Importing modules over the network (vs the local `./modules/` examples in
[13-modules](../13-modules/)). Every example uses a **real, public** repo, so
they run as-is.

| Example | Source form | Repo |
|---------|-------------|------|
| [single-repo-module.yml](single-repo-module.yml) | Full Git URL (whole repo = one module) | `orchstep/test-module-single` |
| [versioned-modules.yml](versioned-modules.yml) | Full URL + semver constraints | `orchstep/test-module-single` (v1.1.0, v2.0.0) |
| [custom-registry-monorepo.yml](custom-registry-monorepo.yml) | `registries:` + `@mycompany/<name>` | `orchstep/monorepo-multi-modules` |
| [builtin-scope.yml](builtin-scope.yml) | Built-in `@community` scope | official registry |
| [module-lockfile.yml](module-lockfile.yml) | Pin versions with `orchstep module lock` | `orchstep/test-module-single` |
