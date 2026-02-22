## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2024-05-24 - [HIGH] Username Enumeration via Timing Attack
**Vulnerability:** The login endpoint `app/api/auth/login/route.ts` returned immediately if a username was not found, but performed a slow `bcrypt.compare` if the username existed. This timing difference allowed attackers to enumerate valid usernames.
**Learning:** Early returns in authentication flows can leak information about the existence of records. Security-critical comparisons should be constant-time.
**Prevention:** Implemented a dummy hash comparison when the user is not found, ensuring the request always takes the same amount of time regardless of user existence.
