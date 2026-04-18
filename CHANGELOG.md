# rpcraft

## 0.2.4

### Patch Changes

- 748eef1: fix: :bug: Add trailing text token after processing placeholders

  Ensure text after the last placeholder is captured as a text token

- a108a27: chore: :arrow_up: Upgrade dependencies

  - eventsource-parser: ^3.0.6 → ^3.0.7
  - @changesets/cli: ^2.30.0 → ^2.31.0
  - oxfmt: ^0.44.0 → ^0.45.0
  - oxlint: ^1.59.0 → ^1.60.0
  - tsdown: ^0.21.7 → ^0.21.9
  - typescript: ^6.0.2 → ^6.0.3

## 0.2.3

### Patch Changes

- 5edce20: Add `Event`, `State`, and `subscribe` for reactive primitives
  - Add `Event` class with lazy activation/deactivation and multi-subscriber support
  - Add `State` class for reactive state management with current value access
  - Add `Subscriber` interface and `subscribe` function for observer pattern
  - Rename `LogLinkHandler` `reason` parameter to `error` for clarity

## 0.2.2

### Patch Changes

- af90eef: Add `RelayMessagePort` and `RelayMessageChannel` for flexible message transport
  - `RelayMessagePort`: Wraps any message mechanism (Electron IPC, WebSocket, etc.) into `RPCMessagePort`
  - `RelayMessageChannel`: Creates a bidirectional message channel within the same thread
  - **Note on lifecycle differences from native MessagePort:**
    - `start()` only affects message receiving; `postMessage` can be called before start
    - `close()` stops receiving but `postMessage` can still be called (messages sent to a closed port are silently dropped)
  - Auto-starts by default with optional manual control

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
