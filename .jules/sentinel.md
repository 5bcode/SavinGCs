## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.
## 2025-03-05 - Constant-Time Authentication Verification
**Vulnerability:** User enumeration is possible via timing attacks because the slow `bcrypt.compareSync` call is skipped when a user is not found during login.
**Learning:** `bcrypt.compareSync` has significant overhead (130ms-240ms). Early returns during authentication skip this work and create a timing difference that attackers can use to confirm whether a username exists in the system.
**Prevention:** Always ensure constant-time verification is performed during authentication by evaluating against a pre-calculated `DUMMY_HASH` if the user is not found, thereby maintaining consistent response times.
