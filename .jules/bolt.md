## 2024-05-23 - Date Parsing Optimization
**Learning:** The application consistently uses "YYYY-MM-DD" strings for dates in the database and API. This allows for manual string parsing (splitting by '-') which is significantly faster than `new Date()` instantiation in tight loops, especially for large transaction lists.
**Action:** When working with dates in lists/loops, prefer manual string manipulation over `Date` objects if the format is known and simple.
