## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.
## 2024-05-23 - [HIGH] Username Enumeration via Timing Attacks
**Vulnerability:** The login endpoint returned a 401 immediately if a user was not found, but performed an expensive `bcrypt.compareSync` (taking ~130-240ms) if the user existed. An attacker could measure the response time to determine if a given username exists in the system.
**Learning:** `bcrypt` operations are intentionally slow. Conditional logic that bypasses this expensive operation when a user is not found creates a highly reliable side-channel for username enumeration.
**Prevention:** Pre-calculate a `DUMMY_HASH` using `bcrypt.hashSync` at module initialization. When authenticating, if the user is not found, perform `bcrypt.compareSync` against the dummy hash with the provided password. This ensures the endpoint always takes roughly the same amount of time regardless of whether the username is valid or not.
