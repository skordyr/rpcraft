---
"rpcraft": patch
---

Improve package exports with explicit `types` condition for IDE auto-completion

- Add `./links/*` wildcard exports with `types` and `default` conditions
- Update tsdown config to use custom exports configuration
- Enable TypeScript language server to resolve types for subpath imports
