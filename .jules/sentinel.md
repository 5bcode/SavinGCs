## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2024-05-23 - [HIGH] Username Enumeration via Timing Attack
**Vulnerability:** The login endpoint (`app/api/auth/login/route.ts`) returned immediately if a username wasn't found in the database. When a username was found, it performed an expensive `bcrypt.compareSync` operation (taking ~130ms-240ms). This predictable timing difference allowed an attacker to determine if a given username existed in the system by measuring the response time.
**Learning:** Returning early on "user not found" is a common anti-pattern in authentication endpoints. The time taken to process a login request must be roughly constant regardless of whether the user exists or not, especially when using expensive hashing algorithms like bcrypt.
**Prevention:** Always perform the expensive hashing operation even if the user is not found. Implemented a dummy bcrypt hash comparison (using a static dummy hash) for cases where the user doesn't exist to equalize response times.
