## 2024-05-22 - SQL Index Optimization
**Learning:** SQLite's query planner is sensitive to multi-column index order. When optimizing a query with `WHERE user_id = ? ORDER BY transaction_date DESC, created_at DESC`, a composite index on `(user_id, transaction_date DESC, created_at DESC)` allows it to skip the sorting phase entirely ("USE TEMP B-TREE FOR RIGHT PART OF ORDER BY").
**Action:** Always verify query plans with `EXPLAIN QUERY PLAN` when dealing with sorted lists, and use composite indexes that match the sort order exactly.
