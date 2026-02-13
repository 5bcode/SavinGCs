## 2026-02-13 - [CRITICAL] Session Hijacking via Unsigned Cookies
**Vulnerability:** User session data (including ID) was stored as plain, unsigned JSON in cookies. Any user could forge a session by manually setting the cookie value to `{"id": <victim_id>, ...}`.
**Learning:** Default cookie mechanisms do not sign or encrypt data. Relying on client-side cookies for authentication without server-side validation (signature/hmac) is fundamentally insecure.
**Prevention:** Always sign session cookies using HMAC-SHA256 or similar. Verify the signature on every request. Never trust client-provided data, even cookies.
