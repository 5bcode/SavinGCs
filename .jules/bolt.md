## 2024-05-23 - Date Formatting Performance
**Learning:** `new Date().toLocaleDateString()` is extremely slow (approx 278x slower than manual parsing) for simple 'YYYY-MM-DD' formatting in loops.
**Action:** Use `formatDateLong` and `formatDateShort` from `lib/utils.ts` for high-frequency rendering of ISO date strings.
