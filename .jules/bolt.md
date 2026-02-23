## 2025-02-21 - Date Formatting Performance
**Learning:** `new Date().toLocaleDateString()` is extremely slow (~1ms per call) in this environment compared to manual string parsing (~0.003ms). For lists of 1000+ items (transactions), this adds up to perceptible lag (1s vs 30ms).
**Action:** Use manual string parsing/formatting for 'YYYY-MM-DD' dates in tight loops or large lists. Avoid `new Date()` object creation just for formatting if the input is already a structured string.
