export type StatusColorBase = {
    readonly bg: string;
    readonly border: string;
    readonly text: string;
    readonly badge: string;
}

export type StatusColorWithOptional = StatusColorBase & {
    readonly opacity?: string;
    readonly ring?: string;
}
/**
 * Task Status Color Configuration
 * Defines background, text, border, and badge colors for each task status
 */

export const TASK_STATUS_COLORS = {
    ASSIGNED: {
        bg: '#F5F5F5',
        border: 'border-l-blue-500',
        text: 'text-blue-950',
        badge: 'bg-blue-100 text-blue-800',
    },
    IN_PROGRESS: {
        bg: '#F5F5F5',
        border: 'border-l-purple-500',
        text: 'text-purple-950',
        badge: 'bg-purple-100 text-purple-800',
    },
    REVIEW: {
        bg: '#F5F5F5',
        border: 'border-l-yellow-500',
        text: 'text-yellow-950',
        badge: 'bg-yellow-100 text-yellow-800',
    },
    DONE: {
        bg: '#F5F5F5',
        border: 'border-l-green-500',
        text: 'text-green-950',
        badge: 'bg-green-100 text-green-800',
    },
    OVERDUE: {
        bg: '#C3110C',
        border: '#740A03',
        text: 'text-white',
        badge: '#E6501B text-white',
        ring: 'ring-2 ring-red-500/50',
    },
} as const;

export type TaskStatus = keyof typeof TASK_STATUS_COLORS;
export type StatusColorConfig = StatusColorWithOptional;
