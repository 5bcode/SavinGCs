## 2025-05-23 - Username Enumeration via Timing Attack

**Vulnerability:** The login endpoint `app/api/auth/login/route.ts` returned immediately if a username was not found in the database, but performed a computationally expensive `bcrypt.compareSync` operation (taking ~240ms) if the username existed. This significant timing difference allowed an attacker to enumerate valid usernames by measuring the response time.

**Learning:** Conditional logic that skips expensive cryptographic operations based on the existence of a record creates a side-channel vulnerability. Even if the error message is identical ("Invalid credentials"), the time to generate that error reveals internal state.

**Prevention:** Ensure that authentication checks always perform the same amount of work regardless of the outcome. In this case, I implemented a "dummy comparison" using a pre-calculated valid bcrypt hash (`DUMMY_HASH`) when the user is not found, ensuring that `bcrypt.compareSync` is executed in all scenarios.
