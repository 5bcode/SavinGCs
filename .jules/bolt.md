## BOLT JOURNAL

## 2024-05-18 - Costly Date operations in render loops
**Learning:** `new Date().toLocaleDateString()` is significantly slower (~45x) than manual string parsing for simple ISO 8601 date strings (`YYYY-MM-DD`). Many components (`SpreadsheetView`, `AccountDetail`, `PotCard`, `ManagePots`, `NetWorthChart`) repeatedly instantiate `Date` objects inside large `.map()` iterations or loops rendering the UI, leading to unnecessary main-thread blocking.
**Action:** Created `formatDateLong` and `formatDateShort` in `lib/utils.ts` to parse `YYYY-MM-DD` strings directly without instantiating `Date` objects, significantly improving render times for transaction lists and charts.
