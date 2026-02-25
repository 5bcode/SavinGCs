## 2024-05-22 - Mobile Number Inputs
**Learning:** Using `inputMode="decimal"` on text inputs for currency is a massive UX win for mobile users compared to `type="text"`.
**Action:** Always check number inputs on mobile view and apply `inputMode="decimal"` if not using `type="number"`.

## 2025-05-18 - Icon-Only Buttons
**Learning:** Icon-only buttons (like "Unallocate" or "Delete" in transaction lists) are frequently missing `aria-label` attributes, making them inaccessible to screen readers.
**Action:** Always verify icon-only buttons have a descriptive `aria-label` or `title` (though `aria-label` is preferred for screen readers).
