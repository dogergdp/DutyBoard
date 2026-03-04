export const formatInManila = (
    value: string | Date,
    options: Intl.DateTimeFormatOptions,
) =>
    new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        ...options,
    }).format(typeof value === 'string' ? new Date(value) : value);

export const getStatusVariant = (status: string) => {
    switch (status) {
        case 'DONE': return 'default';
        case 'IN_PROGRESS': return 'secondary';
        case 'REVIEW': return 'outline';
        case 'BLOCKED': return 'destructive';
        default: return 'outline';
    }
};

export const getPriorityVariant = (priority: string) => {
    switch (priority) {
        case 'URGENT': return 'destructive';
        case 'HIGH': return 'default';
        case 'MED': return 'secondary';
        default: return 'outline';
    }
};
