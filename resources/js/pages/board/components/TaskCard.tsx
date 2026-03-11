import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDistanceToNow, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatInManila } from '../utils';
import { TASK_STATUS_COLORS } from '../config/status-colors';
import type { Task } from '../types';

interface TaskCardProps {
    task: Task;
    animated: boolean;
    flipped: boolean;
    disappearing: boolean;
    currentTime?: Date;
}

export default function TaskCard({
    task,
    animated,
    flipped,
    disappearing,
    currentTime = new Date(),
}: TaskCardProps) {
    const [hovered, setHovered] = useState(false);
    const [progressDots, setProgressDots] = useState('');
    const dueDate = task.due_at ? new Date(task.due_at) : null;
    const overdue = dueDate && isPast(dueDate) && task.status !== 'DONE';
    const age = formatDistanceToNow(new Date(task.created_at), { addSuffix: true });

    useEffect(() => {
        if (task.status !== 'IN_PROGRESS' && task.status !== 'REVIEW') {
            setProgressDots('');
            return;
        }

        const interval = setInterval(() => {
            setProgressDots((previous) => (previous.length >= 3 ? '' : `${previous}.`));
        }, 400);

        return () => clearInterval(interval);
    }, [task.status]);

    const getOverdueLabel = () => {
        if (!overdue || !dueDate) return null;
        
        const daysDiff = differenceInDays(currentTime, dueDate);
        const hoursDiff = differenceInHours(currentTime, dueDate);
        
        if (daysDiff > 0) {
            return `Overdue by ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
        } else if (hoursDiff > 0) {
            return `Overdue by ${hoursDiff} hour${hoursDiff > 1 ? 's' : ''}`;
        }
        return 'Overdue';
    };

    // Determine which color config to use
    const colorConfig = overdue ? TASK_STATUS_COLORS.OVERDUE : TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS] || TASK_STATUS_COLORS.ASSIGNED;

    // Helper to detect hex color strings like '#ff0000'
    const isHex = (s?: string) => typeof s === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s);

    // Build inline styles when hex colors are provided in the status config
    const inlineStyle: React.CSSProperties = {};
    if (isHex(colorConfig.bg)) inlineStyle.backgroundColor = colorConfig.bg as string;
    if (isHex(colorConfig.text)) inlineStyle.color = colorConfig.text as string;
    // If border is a hex value, apply it to the left border color
    if (isHex(colorConfig.border)) inlineStyle.borderLeftColor = colorConfig.border as string;

    const statusText = () => {
        if (task.status === 'IN_PROGRESS') {
            return (
                <span className={cn('whitespace-nowrap', colorConfig.text)}>
                    In Progress
                    <span className="inline-block min-w-[1.5ch] text-left">{progressDots}</span>
                </span>
            );
        }

        if (task.status === 'REVIEW') {
            return (
                <span className={cn('whitespace-nowrap', colorConfig.text)}>
                    Being Reviewed
                    <span className="inline-block min-w-[1.5ch] text-left">{progressDots}</span>
                </span>
            );
        }

        if (task.status === 'ASSIGNED') {
            return 'Assigned';
        }

        return task.status.replace('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
    };

    return (
        <div
            className="relative cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Card
                className={cn(
                    'relative shadow-sm hover:shadow-md transition-all overflow-visible transition-max-h ml-2 mb-2',
                    animated ? 'animate-task-slide-in' : '',
                    flipped ? 'animate-task-flip' : '',
                    disappearing ? 'animate-task-disappear' : '',
                    !isHex(colorConfig.bg) && colorConfig.bg,
                    !isHex(colorConfig.border) && colorConfig.border,
                    overdue && (colorConfig as any).ring,
                    overdue && 'animate-pulse-light',
                    hovered ? 'max-h-[900px] animate-task-expand' : 'max-h-28'
                )}
                style={inlineStyle}
            >
                {/* Top right corner: Overdue badge - fixed position */}
                {overdue && (
                    <div className="absolute -top-3 -right-3 w-40 h-10 flex items-center justify-center bg-destructive text-white rounded animate-pulse z-50">
                        <span className="text-sm font-bold text-center text-white px-1">{getOverdueLabel()}</span>
                    </div>
                )}
            <CardHeader className={cn('relative px-3 py-2 2xl:px-4 2xl:py-2')}>
                {/* Title row with priority and overdue badge */}
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className={cn(
                        'text-2xl leading-tight font-black 2xl:text-xl flex-1',
                        colorConfig.text,
                        hovered ? '' : 'truncate'
                    )}>
                        {task.title}
                    </CardTitle>

                </div>
                {/* Priority and Status row */}
                <div className="flex items-center justify-between mt-1.5">
                    <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">
                        {task.priority}
                    </Badge>
                    {/* Status text */}
                    <span className={cn('text-lg  2xl:text-l', colorConfig.text)}>{statusText()}</span>
                </div>
            </CardHeader>
            {hovered && (
                <CardContent className={cn(
                    'space-y-2 p-3 pt-0 2xl:p-4 2xl:pt-0',
                    colorConfig.text
                )}>
                    <p className={cn(
                        'text-lg',
                        colorConfig.text,
                    )}>
                        {task.description}
                    </p>
                    <div className="grid gap-2">
                        <div className={cn(
                            'flex items-center justify-between rounded px-2 py-1 text-lg font-semibold 2xl:text-2xl',
                            `${colorConfig.bg} ${colorConfig.text}`
                        )}>
                            <span>Created: {age}</span>
                        </div>
                        {task.due_at && (
                            <div
                                className={cn(
                                    'flex items-center justify-between rounded px-2 py-1 text-lg font-semibold 2xl:text-2xl',
                                    `${colorConfig.bg} ${colorConfig.text}`
                                )}
                            >
                                <span>
                                    Due:{' '}
                                    {formatInManila(task.due_at, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
            </Card>
        </div>
    );
}
