## 2024-05-18 - [Optimization of Date Parsing]
**Learning:** `Date.parse(dateString)` is significantly faster (~2x) than `new Date(dateString).getTime()`. String comparison (`a.localeCompare(b)`) for ISO 8601 dates is even faster (~3-15x) than creating Date objects to compare them.
**Action:** Use `Date.parse` or string comparison instead of `new Date().getTime()` or `new Date()` for sorting and comparing dates when dealing with standard ISO 8601 date strings.
