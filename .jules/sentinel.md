## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2026-03-01 - [CRITICAL] Username Enumeration via Timing Attack
**Vulnerability:** The login API immediately returned an error when a username was not found. Because valid users triggered `bcrypt.compareSync` (which takes 130-240ms), an attacker could measure response times to enumerate valid usernames.
**Learning:** Password hashing algorithms are intentionally slow. Conditional execution of slow operations based on user input allows timing side channels. You must perform the slow operation regardless of the outcome of the fast operation (like a DB lookup).
**Prevention:** Pre-calculate a dummy hash at module load. If a user is not found, compare the provided password against the dummy hash to ensure a constant-time response.
