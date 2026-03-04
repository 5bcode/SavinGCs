## 2024-05-22 - Mobile Number Inputs
**Learning:** Using `inputMode="decimal"` on text inputs for currency is a massive UX win for mobile users compared to `type="text"`.
**Action:** Always check number inputs on mobile view and apply `inputMode="decimal"` if not using `type="number"`.
## 2024-05-23 - Dynamic Toggle ARIA Labels
**Learning:** Using `aria-label` with template literals (e.g. `\`Select icon ${key}\``) and `aria-pressed` based on component state is a clean and effective pattern for making custom toggle buttons (like color or icon selectors) accessible to screen readers.
**Action:** Consistently apply `aria-pressed={state === value}` and dynamic `aria-label`s to all custom radio/toggle button implementations.
