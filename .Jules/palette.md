## 2024-05-22 - Mobile Number Inputs
**Learning:** Using `inputMode="decimal"` on text inputs for currency is a massive UX win for mobile users compared to `type="text"`.
**Action:** Always check number inputs on mobile view and apply `inputMode="decimal"` if not using `type="number"`.

## 2024-05-22 - Icon-only buttons accessibility
**Learning:** The app relies heavily on icon-only buttons for important actions like editing, deleting, or closing modals (e.g. `ManagePots.tsx`, `ManageAccounts.tsx`). Missing `aria-label` or `title` on these makes them completely unusable for screen readers.
**Action:** Always verify that every `.icon-btn` or button lacking text content has a descriptive `aria-label` (and usually a `title` for mouse users) that accurately describes the action it performs.
