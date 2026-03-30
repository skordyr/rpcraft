---
"rpcraft": patch
---

Fix missing query string separator in HTTP request URL construction

Added missing `?` character when building URLs with search parameters. Previously, URLs were incorrectly formatted as `{url}{search}` instead of `{url}?{search}`.
