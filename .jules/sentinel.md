## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2024-05-22 - [HIGH] Username Enumeration via Timing Attack
**Vulnerability:** The login endpoint (`POST /api/auth/login`) returned `401 Invalid credentials` immediately if the username was not found, skipping the expensive `bcrypt.compareSync` operation. This timing difference (~100ms) allowed attackers to enumerate valid usernames.
**Learning:** Even if the error message is identical, the *time* it takes to respond leaks information. Security-critical paths must have consistent execution time regardless of the outcome (Constant Time execution).
**Prevention:** Implemented a `DUMMY_HASH` comparison. If the user is not found, the system compares the provided password against this dummy hash, ensuring the request takes the same amount of time as a valid user login attempt.
