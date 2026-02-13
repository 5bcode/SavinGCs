## 2026-02-13 - Dual Toast System
**Learning:** The app has two toast systems: `components/ui/Toast.tsx` (client-side, immediate feedback) and `components/ToastNotifications.tsx` (server-side polling).
**Action:** Use `components/ui/Toast` (`useToast` hook) for immediate user interaction feedback (e.g., form success/error). Use the other one only for async backend notifications.
