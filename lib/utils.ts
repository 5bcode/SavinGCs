export function getIcon(icon: string) {
    const icons: Record<string, string> = {
        'piggy-bank': '🐷', 'house': '🏡', 'car': '🚗', 'vacation': '🏖️',
        'emergency': '🚨', 'wedding': '💍', 'education': '🎓', 'savings': '💰',
        'tent': '⛺'
    };
    return icons[icon] || '💰';
}

/**
 * Fast date formatting for YYYY-MM-DD strings.
 * Significantly faster than new Date().toLocaleDateString()
 * @param dateString YYYY-MM-DD or standard date string
 * @returns "Day Month Year" (e.g., "1 January 2023")
 */
export function formatDateLong(dateString: string): string {
    if (!dateString) return '';

    // Fast path for standard YYYY-MM-DD
    // Check length and dashes at specific positions to avoid regex overhead if possible,
    // but a simple regex is also very fast compared to Date parsing.
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
    }

    // Fallback for full ISO strings or other formats
    try {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}
