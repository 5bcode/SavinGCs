## 2024-05-22 - Mobile Number Inputs
**Learning:** Using `inputMode="decimal"` on text inputs for currency is a massive UX win for mobile users compared to `type="text"`.
**Action:** Always check number inputs on mobile view and apply `inputMode="decimal"` if not using `type="number"`.

## 2024-05-24 - Icon-Only Buttons
**Learning:** Icon-only buttons (like delete or edit actions) are invisible to screen readers without explicit labels.
**Action:** Always add `aria-label` to buttons that lack visible text, describing the action and the context (e.g., "Delete account [Account Name]" instead of just "Delete").
