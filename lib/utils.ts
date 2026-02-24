export function getIcon(icon: string) {
    const icons: Record<string, string> = {
        'piggy-bank': '🐷', 'house': '🏡', 'car': '🚗', 'vacation': '🏖️',
        'emergency': '🚨', 'wedding': '💍', 'education': '🎓', 'savings': '💰',
        'tent': '⛺'
    };
    return icons[icon] || '💰';
}

const MONTHS_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * High-performance date formatter for YYYY-MM-DD strings.
 * Returns "15 October 2023"
 * Avoids Date object creation and locale overhead.
 */
export function formatDateLong(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (monthIndex < 0 || monthIndex > 11) return dateStr;

    return `${day} ${MONTHS_LONG[monthIndex]} ${year}`;
}

/**
 * High-performance date formatter for YYYY-MM-DD strings.
 * Returns "15 Oct 2023"
 * Avoids Date object creation and locale overhead.
 */
export function formatDateShort(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (monthIndex < 0 || monthIndex > 11) return dateStr;

    return `${day} ${MONTHS_SHORT[monthIndex]} ${year}`;
}
