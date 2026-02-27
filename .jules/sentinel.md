## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.
## 2024-05-22 - [HIGH] Username Enumeration via Timing Attack
**Vulnerability:** The login endpoint `app/api/auth/login/route.ts` returned early if a user was not found, skipping the expensive `bcrypt.compareSync` operation. This timing difference allowed attackers to enumerate existing usernames.
**Learning:** Authentication endpoints must always perform computationally expensive operations (like password hashing comparisons) regardless of whether the user exists to prevent timing attacks.
**Prevention:** Pre-calculate a dummy hash at module load and always perform the comparison against either the real hash or the dummy hash, returning a generic error message in both failure cases.
