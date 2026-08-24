# rpcraft

## 0.3.1

### Patch Changes

- 66b2ea2: feat(http-link): :sparkles: add `QUERY` method to `HTTPRequestMethod`
- 99079e0: refactor(http-link): :recycle: add early falsy guard to `toNativeURLSearchParams`
- 515ab34: chore: :arrow_up: Upgrade dependencies

  - eventsource-parser: ^4.0.0 → ^4.1.0
  - @changesets/cli: ^3.0.0 → ^3.0.1
  - oxfmt: ^0.63.0 → ^0.64.0
  - oxlint: ^1.78.0 → ^1.79.0
  - pnpm: 11.22.0 → 11.23.0

## 0.3.0

### Minor Changes

- 0541fd4: feat(http-link): :sparkles: add requestDataType, rename responseType to responseDataType, add raw response

  - Add `requestDataType` option to `request()` and `HTTPLink` meta to choose how `data` is serialized into the request body: `"text" | "json" | "form-urlencoded" | "form-data" | "raw"`.
  - Add `"raw"` to `responseDataType` to yield the raw `Response` object without parsing.
  - `null`/`undefined` values in `params`/`headers` are now omitted from the query string/headers — previously `null` was serialized as `a=null`.
  - **Breaking**: `requestDataType` defaults to `"json"`, so every non-null `data` is now JSON-serialized. Previously only plain objects/arrays were serialized; strings, `FormData`, `Blob` and `URLSearchParams` were passed through raw. Callers sending those as raw bodies must set `requestDataType: "text"` (strings) or `"raw"`/`"form-data"` explicitly.
  - **Breaking**: rename `responseType` → `responseDataType` (option and `HTTPLink` meta), and `HTTPRequestResponseType` → `HTTPRequestResponseDataType` (type).
  - **Breaking**: multi-value response headers (e.g. `set-cookie`) in `result.headers` are now arrays (`['a=1', 'b=2']`) instead of last-value-wins — matching what `HTTPRequestHeaders` already allowed.

## 0.2.7

### Patch Changes

- d50c380: refactor: :recycle: Canonicalize meta/schema in Router.prepare and invoke the matched link without re-matching

  - `Router.prepare` canonicalizes the operation's command meta/schema to the factory's definition instead of merging them.
  - MockLink and RPCServer resolve the matched link directly on the operation prepared by `Router.prepare`, avoiding a second `Router.match`.

- 8c5d8e8: chore: :arrow_up: Upgrade dependencies

  - eventsource-parser: ^3.1.0 → ^4.0.0
  - @changesets/cli: ^2.31.1 → ^3.0.0
  - oxfmt: ^0.62.0 → ^0.63.0
  - oxlint: ^1.77.0 → ^1.78.0

## 0.2.6

### Patch Changes

- 30d1672: docs: :memo: Polish README.md and add keywords to package.json

## 0.2.5

### Patch Changes

- e63f844: :sparkles: feat: Support `:raw` modifier for template variables

  Add `:raw` suffix support to skip escape processing for template variables.

  Syntax: `{name:raw}` or `{name:raw ?? fallback}`

  When `:raw` is specified, the variable value is output as-is without
  transformation, bypassing the configured escape function.

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
