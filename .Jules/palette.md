# Palette's Journal

## 2025-05-15 - Missing ARIA Labels on Icon Buttons
**Learning:** Several icon-only buttons (e.g. in `ManagePots.tsx`) lack `aria-label` or `title`, making them inaccessible to screen readers.
**Action:** Always add `aria-label` to icon-only buttons during future refactors or new implementations.
