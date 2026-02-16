## 2026-02-16 - [HIGH] Fix IDOR in transactions endpoint
**Vulnerability:** The `GET /api/transactions` endpoint allowed any authenticated user to list all transactions in the database, regardless of account ownership. This exposed sensitive financial data to unauthorized users.
**Learning:** Authorization in this app relies on the `account.owner` string field matching `user.display_name` (or 'Joint'). This string-based authorization is fragile compared to foreign key relationships but is the established pattern here.
**Prevention:** Always filter queries by user ID or account ownership when fetching sensitive data. Do not assume authentication implies authorization for all resources.
