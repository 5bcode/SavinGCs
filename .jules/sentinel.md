## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2026-02-24 - [HIGH] Timing Attack on User Enumeration
**Vulnerability:** The login endpoint `api/auth/login` returned early if a username was not found (0.00ms), whereas checking a valid user (but wrong password) took significant time (~130ms) due to `bcrypt` hashing. This allowed attackers to enumerate valid usernames by measuring response time.
**Learning:** Security functions like `bcrypt.compareSync` are computationally expensive by design. Conditional execution based on user existence creates a side-channel.
**Prevention:** Always perform the expensive operation (hashing) even if the user is not found, using a dummy hash to normalize execution time. Refactored login logic to ensure constant-time response regardless of user existence.
