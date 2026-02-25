## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2025-05-22 - [HIGH] Username Enumeration via Timing Attack
**Vulnerability:** The login endpoint (`/api/auth/login`) returned immediately if a username was not found, but performed an expensive `bcrypt` comparison if the user existed. This timing difference (~100ms) allowed attackers to enumerate valid usernames.
**Learning:** Returning early on "User Not Found" is a common performance optimization that inadvertently leaks information in security-sensitive contexts.
**Prevention:** Use constant-time comparison logic. Always perform the expensive operation (hash comparison), using a dummy hash if the user doesn't exist, to ensure the response time is indistinguishable.
