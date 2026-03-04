export function getIcon(icon: string) {
    const icons: Record<string, string> = {
        'piggy-bank': '🐷', 'house': '🏡', 'car': '🚗', 'vacation': '🏖️',
        'emergency': '🚨', 'wedding': '💍', 'education': '🎓', 'savings': '💰',
        'tent': '⛺'
    };
    return icons[icon] || '💰';
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatDateShort(dateString: string): string {
    if (!dateString) return '';
    const parts = dateString.split('T')[0].split('-');
    if (parts.length !== 3) return dateString;
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

export function formatDateLong(dateString: string): string {
    if (!dateString) return '';
    const parts = dateString.split('T')[0].split('-');
    if (parts.length !== 3) return dateString;
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${day} ${MONTHS_LONG[month - 1]} ${year}`;
}
