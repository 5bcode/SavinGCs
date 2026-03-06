## 2024-05-22 - [CRITICAL] Insecure Session Cookie Tampering
**Vulnerability:** Session cookies (`user_session`) were stored as plain, unsigned JSON objects. Any user could modify the cookie to impersonate another user (Broken Access Control).
**Learning:** The implementation relied on `JSON.parse` of the cookie value without any cryptographic verification, assuming the client wouldn't tamper with it. This is a common mistake when rolling custom auth.
**Prevention:** Always use cryptographic signatures (HMAC) or encryption for client-side session storage. Never trust client-provided data without verification. Implemented `lib/session.ts` to sign and verify cookies.

## 2024-05-23 - [CRITICAL] IDOR in Accounts API
**Vulnerability:** The `app/api/accounts/[id]/route.ts` endpoint allowed any authenticated user to view, modify, or delete any account in the database by passing its ID in the URL.
**Learning:** The implementation assumed that only the frontend UI would control which accounts a user could access, forgetting that the API endpoints themselves must enforce authorization.
**Prevention:** Always verify that the requested resource belongs to the currently authenticated user before performing read, update, or delete operations. Added `account.owner` checks against `user.displayName` (or 'Joint') in the GET, PATCH, and DELETE handlers.
