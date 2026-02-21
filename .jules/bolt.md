## 2024-05-23 - Date Formatting Performance
**Learning:** `new Date(string).toLocaleDateString()` is extremely slow (approx 45x slower) compared to manual string parsing for standard 'YYYY-MM-DD' dates in this environment. The overhead comes from `Date` object instantiation and the `Intl` formatter.
**Action:** Use `formatDateLong` helper in `lib/utils.ts` for date formatting in hot paths (like loops or render functions).
