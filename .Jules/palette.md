## 2024-05-22 - Mobile Number Inputs
**Learning:** Using `inputMode="decimal"` on text inputs for currency is a massive UX win for mobile users compared to `type="text"`.
**Action:** Always check number inputs on mobile view and apply `inputMode="decimal"` if not using `type="number"`.

## 2024-06-25 - Icon-only buttons
**Learning:** Adding `aria-label` to icon-only buttons provides immediate, clear context for assistive technologies without cluttering the visual interface.
**Action:** Consistently ensure that buttons containing only an icon (like `svg` or emoji) also have a descriptive `aria-label` that clarifies what action the button performs.
