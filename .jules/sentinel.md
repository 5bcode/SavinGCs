## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2024-05-24 - Prevent IDOR Vulnerabilities in Direct DB Queries
**Vulnerability:** IDOR in the accounts API allowed users to read, update, or delete any account by passing its ID, because direct DB queries lacked ownership checks.
**Learning:** Relying solely on the presence of a user session without verifying the ownership of the specific resource being accessed leaves endpoints vulnerable to IDOR.
**Prevention:** Always verify that the requested resource belongs to the currently authenticated user (e.g., `owner === 'Joint' || owner === user.displayName`) before allowing read, update, or delete operations.
