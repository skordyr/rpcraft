---
"rpcraft": minor
---

Add `RelayMessagePort` and `RelayMessageChannel` for flexible message transport

- `RelayMessagePort`: Wraps any message mechanism (Electron IPC, WebSocket, etc.) into `RPCMessagePort`
- `RelayMessageChannel`: Creates a bidirectional message channel within the same thread
- **Note on lifecycle differences from native MessagePort:**
  - `start()` only affects message receiving; `postMessage` can be called before start
  - `close()` stops receiving but `postMessage` can still be called (messages sent to a closed port are silently dropped)
- Auto-starts by default with optional manual control
