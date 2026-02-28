export function getIcon(icon: string) {
    const icons: Record<string, string> = {
        'piggy-bank': '🐷', 'house': '🏡', 'car': '🚗', 'vacation': '🏖️',
        'emergency': '🚨', 'wedding': '💍', 'education': '🎓', 'savings': '💰',
        'tent': '⛺'
    };
    return icons[icon] || '💰';
}

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * High-performance formatter for "YYYY-MM-DD" date strings.
 * Avoids expensive `new Date()` allocation and `toLocaleDateString` which blocks the main thread in large render loops.
 * Output format: "D MMMM YYYY" (e.g. "25 October 2023")
 */
export function formatDateLong(dateStr: string): string {
    if (!dateStr || dateStr.length < 10) return dateStr;
    const y = dateStr.substring(0, 4);
    const m = parseInt(dateStr.substring(5, 7), 10) - 1;
    const d = parseInt(dateStr.substring(8, 10), 10);
    return `${d} ${MONTHS_LONG[m]} ${y}`;
}

/**
 * High-performance formatter for "YYYY-MM-DD" date strings.
 * Output format: "MMM YYYY" (e.g. "Oct 2023") or "D MMM YYYY" (e.g. "25 Oct 2023")
 */
export function formatDateShort(dateStr: string, includeDay: boolean = true): string {
    if (!dateStr || dateStr.length < 10) return dateStr;
    const y = dateStr.substring(0, 4);
    const m = parseInt(dateStr.substring(5, 7), 10) - 1;
    if (includeDay) {
        const d = parseInt(dateStr.substring(8, 10), 10);
        return `${d} ${MONTHS_SHORT[m]} ${y}`;
    }
    return `${MONTHS_SHORT[m]} ${y}`;
}
