---
"rpcraft": minor
---

feat(http-link): :sparkles: add requestDataType, rename responseType to responseDataType, add raw response

- Add `requestDataType` option to `request()` and `HTTPLink` meta to choose how `data` is serialized into the request body: `"text" | "json" | "form-urlencoded" | "form-data" | "raw"`.
- Add `"raw"` to `responseDataType` to yield the raw `Response` object without parsing.
- `null`/`undefined` values in `params`/`headers` are now omitted from the query string/headers — previously `null` was serialized as `a=null`.
- **Breaking**: `requestDataType` defaults to `"json"`, so every non-null `data` is now JSON-serialized. Previously only plain objects/arrays were serialized; strings, `FormData`, `Blob` and `URLSearchParams` were passed through raw. Callers sending those as raw bodies must set `requestDataType: "text"` (strings) or `"raw"`/`"form-data"` explicitly.
- **Breaking**: rename `responseType` → `responseDataType` (option and `HTTPLink` meta), and `HTTPRequestResponseType` → `HTTPRequestResponseDataType` (type).
- **Breaking**: multi-value response headers (e.g. `set-cookie`) in `result.headers` are now arrays (`['a=1', 'b=2']`) instead of last-value-wins — matching what `HTTPRequestHeaders` already allowed.
