## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2024-05-23 - [CRITICAL] Username Enumeration via Timing Attack
**Vulnerability:** The login endpoint returned an error early if a user was not found, bypassing the expensive `bcrypt.compareSync` operation. This allowed an attacker to enumerate usernames by measuring response times.
**Learning:** Bcrypt hashing takes a significant and measurable amount of time. An early exit on "user not found" creates a massive timing discrepancy (often 100ms+ difference) compared to a failed password attempt on a valid user.
**Prevention:** Always perform the expensive cryptographic operation regardless of whether the user exists. Pre-calculate a dummy hash at module load and evaluate the incoming password against it when no user record is found to equalize response times.
