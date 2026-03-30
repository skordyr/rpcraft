# rpcraft

## 0.2.1

### Patch Changes

- 44f8ea8: Fix missing query string separator in HTTP request URL construction

  Added missing `?` character when building URLs with search parameters. Previously, URLs were incorrectly formatted as `{url}{search}` instead of `{url}?{search}`.

- 7072a67: Fix README example to log full error object

## 0.2.0

### Minor Changes

- e2c6d4d: Migrate `rpcraft/iterator` subpath export to main package
- c4527fb: Rename link exports for explicit naming
  - `rpcraft/links/http` → `rpcraft/http-link`
  - `rpcraft/links/log` → `rpcraft/log-link`
  - `rpcraft/links/mock` → `rpcraft/mock-link`
  - `rpcraft/links/validate` → `rpcraft/validate-link`

### Patch Changes

- 7565674: Expand README with Installation and Overview tutorial

  Covering command definitions, handlers, link composition, and usage examples.

- 1a01c52: `promise` now supports `onExit` callback for registering dispose functions (executed in LIFO order)
- a28998a: Improve package exports with explicit `types` condition for IDE auto-completion
  - Add `./links/*` wildcard exports with `types` and `default` conditions
  - Update tsdown config to use custom exports configuration
  - Enable TypeScript language server to resolve types for subpath imports

- fce52a4: Refactor error message style for consistency

  Unify error message format to `<reason>. [solution].` (solution is optional when not applicable)

## 0.1.0

### Minor Changes

- 68f516d: introduce rpcraft (first version)
