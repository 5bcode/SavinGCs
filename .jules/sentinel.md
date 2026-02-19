# Sentinel Journal

## 2025-02-17 - Insecure Session Management
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects, allowing attackers to modify the cookie payload (e.g., `id`, `username`) to impersonate any user.
**Learning:** Client-side data, including cookies, can be manipulated by users. Trusting this data without verification leads to privilege escalation.
**Prevention:** Always sign session data using a secret key (HMAC) to ensure integrity. The application now uses HMAC-SHA256 to sign and verify session cookies.
