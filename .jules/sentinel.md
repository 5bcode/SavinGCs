## 2026-02-17 - Insecure Session Management
**Vulnerability:** The application was using a raw JSON cookie (`user_session`) to store user identity without any signature or encryption. This allowed any user to forge a session cookie and impersonate any other user, including administrators.
**Learning:** Trusting client-side storage (cookies, local storage) without server-side validation (signature, encryption, or session ID lookup) is a critical security flaw. Developers often mistake "cookies are hard to edit" for security.
**Prevention:** Always sign or encrypt session cookies using a secret key stored on the server. Use established libraries or patterns (like HMAC) to ensure integrity. Never trust input from the client, including cookies.
