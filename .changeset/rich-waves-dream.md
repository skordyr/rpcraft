---
"rpcraft": patch
---

Add `Event`, `State`, and `subscribe` for reactive primitives

- Add `Event` class with lazy activation/deactivation and multi-subscriber support
- Add `State` class for reactive state management with current value access
- Add `Subscriber` interface and `subscribe` function for observer pattern
- Rename `LogLinkHandler` `reason` parameter to `error` for clarity
