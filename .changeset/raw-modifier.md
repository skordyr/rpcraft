---
"rpcraft": patch
---

:sparkles: feat: Support `:raw` modifier for template variables

Add `:raw` suffix support to skip escape processing for template variables.

Syntax: `{name:raw}` or `{name:raw ?? fallback}`

When `:raw` is specified, the variable value is output as-is without
transformation, bypassing the configured escape function.
