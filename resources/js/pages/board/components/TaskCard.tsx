import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { formatDistanceToNow, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { getStatusVariant, getPriorityVariant, formatInManila } from '../utils';
import { TASK_STATUS_COLORS } from '../config/status-colors';
import type { Task } from '../types';

interface TaskCardProps {
    task: Task;
    expanded: boolean;
    onToggle: () => void;
    animated: boolean;
    flipped: boolean;
    disappearing: boolean;
    currentTime?: Date;
}

export default function TaskCard({
    task,
    expanded,
    onToggle,
    animated,
    flipped,
    disappearing,
    currentTime = new Date(),
}: TaskCardProps) {
    const dueDate = task.due_at ? new Date(task.due_at) : null;
    const overdue = dueDate && isPast(dueDate) && task.status !== 'DONE';
    const blocked = task.status === 'BLOCKED';
    const age = formatDistanceToNow(new Date(task.created_at), { addSuffix: true });

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

    return (
        <Card
            key={task.id}
            className={cn(
                'shadow-sm hover:shadow-md transition-all border-l-4 overflow-hidden transition-max-h',
                animated ? 'animate-task-slide-in' : '',
                flipped ? 'animate-task-flip' : '',
                disappearing ? 'animate-task-disappear' : '',
                // If config uses Tailwind classes for bg/border, keep them; otherwise inline styles will apply
                !isHex(colorConfig.bg) && colorConfig.bg,
                !isHex(colorConfig.border) && colorConfig.border,
                blocked && (colorConfig as any).opacity,
                overdue && (colorConfig as any).ring,
                overdue && 'animate-pulse-light',
                // control max-height to create a consistent card size and animate expansion
                expanded ? 'max-h-[700px] animate-task-expand' : 'max-h-20'
            )}
            style={inlineStyle}
        >
            <CardHeader className={cn('p-3 pb-2 2xl:p-4 2xl:pb-2')}>
                <div className="flex items-start justify-between gap-2">
                    {/* Task name top left */}
                    <CardTitle className={cn(
                        'text-sm leading-tight font-bold 2xl:text-base',
                        colorConfig.text,
                        'self-start'
                    )}>
                        {task.title}
                    </CardTitle>
                    {/* Badges bottom right */}
                    <div className="flex flex-col items-end justify-between flex-1 min-h-[2.5rem]">
                        <div className="flex-1" />
                        <div className="flex flex-wrap gap-2 mt-1 justify-end">
                            <Badge
                                variant={getStatusVariant(task.status)}
                                className="px-2 py-0 text-xs font-medium 2xl:text-sm"
                            >
                                {task.status}
                            </Badge>
                            <Badge
                                variant={getPriorityVariant(task.priority)}
                                className="px-2 py-0 text-xs font-medium 2xl:text-sm"
                            >
                                {task.priority}
                            </Badge>
                            {overdue && (
                                <Badge
                                    variant="destructive"
                                    className="px-2 py-0 text-xs font-bold uppercase animate-pulse"
                                >
                                    {getOverdueLabel()}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                        className="flex-shrink-0 p-1 rounded hover:bg-muted/20 self-start"
                        disabled={blocked}
                    >
                        <ChevronDown
                            className={cn(
                                'w-4 h-4 transition-transform',
                                expanded && 'rotate-180',
                                blocked && 'text-muted-foreground',
                            )}
                        />
                    </button>
                </div>
            </CardHeader>
            {expanded && (
                <CardContent className={cn(
                    'space-y-2 p-3 pt-0 2xl:p-4 2xl:pt-0',
                    colorConfig.text
                )}>
                    <p className={cn(
                        'text-xs',
                        blocked ? 'text-muted-foreground' : colorConfig.text,
                    )}>
                        {task.description}
                    </p>
                    <div className="grid gap-2">
                        <div className={cn(
                            'flex items-center justify-between rounded px-2 py-1 text-xs font-semibold 2xl:text-sm',
                            blocked ? 'bg-muted text-muted-foreground' : `${colorConfig.bg} ${colorConfig.text}`
                        )}>
                            <span>Created: {age}</span>
                        </div>
                        {task.due_at && (
                            <div
                                className={cn(
                                    'flex items-center justify-between rounded px-2 py-1 text-xs font-semibold 2xl:text-sm',
                                    blocked
                                        ? 'bg-muted text-muted-foreground'
                                        : `${colorConfig.bg} ${colorConfig.text}`
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
    );
}
