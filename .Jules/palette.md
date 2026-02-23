## 2024-05-22 - Mobile Number Inputs
**Learning:** Using `inputMode="decimal"` on text inputs for currency is a massive UX win for mobile users compared to `type="text"`.
**Action:** Always check number inputs on mobile view and apply `inputMode="decimal"` if not using `type="number"`.

## 2025-05-24 - Dynamic Aria Labels
**Learning:** For toggle buttons (like "Add Account" / "Cancel") and state toggles (like "Hide Empty"), using dynamic `aria-label` that describes the *action* (e.g., "Cancel add account") is much more helpful than just describing the current state.
**Action:** Always use conditional `aria-label` for buttons that change function/text based on state.
