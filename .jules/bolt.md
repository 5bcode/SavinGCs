## 2024-05-23 - Monolithic Client Page Component
**Learning:** `app/page.tsx` acts as a SPA router using local state, but imported all sub-views statically. This caused the initial bundle to include `ManageAccounts`, `SpreadsheetView`, and `ManagePots` even if they weren't used.
**Action:** Use `next/dynamic` for conditional views in client components to split the bundle.
