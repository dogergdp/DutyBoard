import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task } from '../types';

interface TaskCardProps {
    task: Task;
    expanded: boolean;
    onToggle: () => void;
    animated: boolean;
    flipped: boolean;
    disappearing: boolean;
}

function getStatusVariant(status: string) {
    switch (status) {
        case 'DONE':
            return 'default';
        case 'IN_PROGRESS':
            return 'secondary';
        case 'REVIEW':
            return 'outline';
        case 'BLOCKED':
            return 'destructive';
        default:
            return 'outline';
    }
}

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'URGENT':
            return 'destructive';
        case 'HIGH':
            return 'default';
        case 'MED':
            return 'secondary';
        default:
            return 'outline';
    }
}

const formatInManila = (
    value: string | Date,
    options: Intl.DateTimeFormatOptions,
) =>
    new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        ...options,
    }).format(typeof value === 'string' ? new Date(value) : value);

export default function TaskCard({
    task,
    expanded,
    onToggle,
    animated,
    flipped,
    disappearing,
}: TaskCardProps) {
    const overdue = task.due_at && isPast(new Date(task.due_at)) && task.status !== 'DONE';
    const age = formatDistanceToNow(new Date(task.created_at), { addSuffix: true });

    return (
        <Card
            key={task.id}
            className={cn(
                'shadow-sm hover:shadow-md transition-all border-l-4',
                animated ? 'animate-task-slide-in' : '',
                flipped ? 'animate-task-flip' : '',
                disappearing ? 'animate-task-disappear' : '',
                overdue
                    ? 'border-l-destructive ring-1 ring-destructive/20 animate-pulse-light shadow-destructive/10'
                    : 'border-l-primary/30',
            )}
        >
            <CardHeader className="p-3 pb-2 2xl:p-4 2xl:pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <CardTitle className="text-sm leading-tight font-bold 2xl:text-base">
                            {task.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
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
                                    className="px-2 py-0 text-xs font-bold uppercase"
                                >
                                    Overdue
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
                        className="flex-shrink-0 p-1 rounded hover:bg-muted/20"
                    >
                        <ChevronDown
                            className={cn(
                                'w-4 h-4 transition-transform',
                                expanded && 'rotate-180',
                            )}
                        />
                    </button>
                </div>
            </CardHeader>
            {expanded && (
                <CardContent className="space-y-2 p-3 pt-0 2xl:p-4 2xl:pt-0">
                    <p className="text-xs text-muted-foreground">
                        {task.description}
                    </p>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs font-semibold text-muted-foreground 2xl:text-sm">
                            <span>Created: {age}</span>
                        </div>
                        {task.due_at && (
                            <div
                                className={cn(
                                    'flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs font-semibold 2xl:text-sm',
                                    overdue ? 'text-destructive' : 'text-muted-foreground',
                                )}
                            >
                                <span>
                                    Due (Manila):{' '}
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
