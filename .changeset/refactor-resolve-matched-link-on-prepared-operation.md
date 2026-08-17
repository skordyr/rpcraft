---
"rpcraft": patch
---

refactor: :recycle: Canonicalize meta/schema in Router.prepare and invoke the matched link without re-matching

- `Router.prepare` canonicalizes the operation's command meta/schema to the factory's definition instead of merging them.
- MockLink and RPCServer resolve the matched link directly on the operation prepared by `Router.prepare`, avoiding a second `Router.match`.
