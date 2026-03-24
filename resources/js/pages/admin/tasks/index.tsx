import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';
import taskRoutes from '@/routes/tasks';
import type { BreadcrumbItem } from '@/types';
import { formatDistanceToNow, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { TASK_STATUS_COLORS } from '../../board/config/status-colors';

type Employee = {
    id: number;
    full_name: string;
    photo_url?: string | null;
};

type Task = {
    id: number;
    title: string;
    description: string;
    assigned_to: number;
    status: string;
    priority: string;
    due_at: string | null;
    created_at?: string;
    employee: Employee;
};

type Filters = {
    employee_id: string | null;
    overdue_only: boolean;
};

type Props = {
    tasks: Task[];
    employees: Employee[];
    statuses: string[];
    priorities: string[];
    filters: Filters;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Tasks',
        href: admin.tasks.index().url,
    },
];

// Reusable Task Card matching /board aesthetic
function AdminTaskCard({ task, onEdit, onStatusChange, statuses, renderAssignee }: { task: Task, onEdit: (t: Task) => void, onStatusChange: (id: number, s: string) => void, statuses: string[], renderAssignee: (e?: Employee) => React.ReactNode }) {
    const [progressDots, setProgressDots] = useState('');
    const [hovered, setHovered] = useState(false);
    const dueDate = task.due_at ? new Date(task.due_at) : null;
    const currentTime = new Date();
    const overdue = dueDate && isPast(dueDate) && task.status !== 'DONE';
    const age = task.created_at ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true }) : 'Recently';

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

    const colorConfig = overdue ? TASK_STATUS_COLORS.OVERDUE : TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS] || TASK_STATUS_COLORS.ASSIGNED;
    const isHex = (s?: string) => typeof s === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s);

    const inlineStyle: React.CSSProperties = {};
    if (isHex(colorConfig.bg)) inlineStyle.backgroundColor = colorConfig.bg as string;
    if (isHex(colorConfig.text)) inlineStyle.color = colorConfig.text as string;
    if (isHex(colorConfig.border)) inlineStyle.borderLeftColor = colorConfig.border as string;

    const statusText = () => {
        if (task.status === 'IN_PROGRESS') {
            return (
                <span className={cn('whitespace-nowrap', colorConfig.text)}>
                    In Progress<span className="inline-block min-w-[1.5ch] text-left">{progressDots}</span>
                </span>
            );
        }
        if (task.status === 'REVIEW') {
            return (
                <span className={cn('whitespace-nowrap', colorConfig.text)}>
                    Being Reviewed<span className="inline-block min-w-[1.5ch] text-left">{progressDots}</span>
                </span>
            );
        }
        if (task.status === 'ASSIGNED') return 'Assigned';
        return task.status.replace('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
    };

    return (
        <Card
            className={cn(
                'relative shadow-sm hover:shadow-md transition-all overflow-visible ml-1 mb-2',
                !isHex(colorConfig.bg) && colorConfig.bg,
                !isHex(colorConfig.border) && colorConfig.border,
                overdue && (colorConfig as any).ring,
            )}
            style={inlineStyle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {overdue && (
                <div className="absolute -top-3 -right-3 w-[150px] h-8 flex items-center justify-center bg-destructive text-white rounded shadow-sm z-50">
                    <span className="text-xs font-bold text-center text-white px-1">{getOverdueLabel()}</span>
                </div>
            )}
            <CardHeader className="relative px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className={cn(
                        'text-lg leading-tight font-bold flex-1',
                        colorConfig.text,
                        hovered ? '' : 'line-clamp-2'
                    )}>
                        {task.title}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(task)}
                        className={cn("h-7 w-7 p-0 shrink-0", colorConfig.text)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
                {task.description && (
                    <div className={cn("mt-2 transition-all", hovered ? '' : 'max-h-12 overflow-hidden')}>
                        <p className={cn("text-sm opacity-80", colorConfig.text, hovered ? '' : 'line-clamp-2')}>
                            {task.description}
                        </p>
                    </div>
                )}
                
                <div className="mt-3 flex items-center justify-between">
                    {renderAssignee(task.employee)}
                    <Badge className={cn("text-xs px-2 py-0.5", colorConfig.badge)}>{task.priority}</Badge>
                </div>

                {task.due_at && (
                    <p className={cn("mt-3 text-xs opacity-80 font-medium", colorConfig.text)}>
                        Due: {dueDate?.toLocaleString()}
                    </p>
                )}

                <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between gap-2">
                    <select
                        value={task.status}
                        onChange={(event) => onStatusChange(task.id, event.target.value)}
                        className={cn(
                            "h-8 rounded-md border-0 bg-black/5 px-2 text-xs shadow-xs outline-none focus:ring-2 focus:ring-black/20 font-medium",
                            colorConfig.text
                        )}
                        style={{ color: isHex(colorConfig.text) ? colorConfig.text as string : undefined }}
                    >
                        {statuses.map((nextStatus) => (
                            <option key={nextStatus} value={nextStatus} className="text-black bg-white">
                                {nextStatus.replace('_', ' ')}
                            </option>
                        ))}
                    </select>

                    {task.status === 'REVIEW' && (
                        <Button
                            size="sm"
                            onClick={() => onStatusChange(task.id, 'DONE')}
                            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Approve
                        </Button>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
}

export default function AdminTasks({ tasks, employees, statuses, priorities, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editProcessing, setEditProcessing] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        assigned_to: '',
        status: 'ASSIGNED',
        priority: 'LOW',
        due_at: '',
    });

    const { data: editData, setData: setEditData, reset: resetEdit, errors: editErrors } = useForm({
        title: '',
        description: '',
        priority: '',
        due_at: '',
    });

    const getInitials = (name?: string | null) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    const renderAssignee = (employee?: Employee) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-7 w-7 border shadow-sm">
                <AvatarImage src={employee?.photo_url ?? undefined} alt={employee?.full_name ?? 'Unknown'} />
                <AvatarFallback className="bg-slate-200 text-[10px] font-semibold text-slate-700">
                    {getInitials(employee?.full_name ?? '')}
                </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{employee?.full_name?.split(' ')[0] ?? 'Unknown'}</span>
        </div>
    );

    const toDateTimeLocalValue = (value: string | null) => {
        if (!value) return '';
        const date = new Date(value);
        const timezoneOffsetInMs = date.getTimezoneOffset() * 60_000;
        return new Date(date.getTime() - timezoneOffsetInMs).toISOString().slice(0, 16);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(admin.tasks.store().url, {
            onSuccess: () => {
                reset('title', 'description', 'assigned_to', 'due_at');
                setData('status', 'ASSIGNED');
                setData('priority', 'LOW');
                setCreateOpen(false);
            },
        });
    };

    const startEditTask = (task: Task) => {
        setEditData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_at: toDateTimeLocalValue(task.due_at),
        });
        setEditingTaskId(task.id);
    };

    const submitEditTask = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (editingTaskId) {
            setEditProcessing(true);
            router.patch(
                `/admin/tasks/${editingTaskId}`,
                {
                    title: editData.title,
                    description: editData.description,
                    priority: editData.priority,
                    due_at: editData.due_at || null,
                },
                {
                    onSuccess: () => {
                        resetEdit();
                        setEditingTaskId(null);
                        setEditProcessing(false);
                    },
                    onError: () => {
                        setEditProcessing(false);
                    },
                    preserveScroll: true,
                }
            );
        }
    };

    const cancelEdit = () => {
        resetEdit();
        setEditingTaskId(null);
    };

    const updateTaskStatus = (taskId: number, status: string) => {
        router.patch(taskRoutes.updateStatus.url(taskId), { status }, {
            preserveScroll: true,
        });
    };

    const updateFilters = (next: Partial<Filters>) => {
        const params = {
            employee_id: 'employee_id' in next ? next.employee_id ?? '' : filters.employee_id ?? '',
            overdue_only: 'overdue_only' in next ? next.overdue_only ?? false : filters.overdue_only,
        };

        router.get(admin.tasks.index().url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const tasksByStatus = statuses.reduce<Record<string, Task[]>>((grouped, status) => {
        grouped[status] = tasks.filter((task) => task.status === status);
        return grouped;
    }, {});

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Tasks" />

            <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
                {/* Horizontal Filter Bar */}
                <div className="flex-none p-4 lg:px-6 border-b border-border/40 bg-card/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="filter-employee" className="text-sm font-medium whitespace-nowrap">Employee:</Label>
                                <select
                                    id="filter-employee"
                                    value={filters.employee_id ?? ''}
                                    onChange={(event) => updateFilters({ employee_id: event.target.value || null })}
                                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-[180px] rounded-md border bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                >
                                    <option value="">All employees</option>
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Label htmlFor="filter-overdue" className="text-sm font-medium whitespace-nowrap">Overdue:</Label>
                                <select
                                    id="filter-overdue"
                                    value={filters.overdue_only ? '1' : '0'}
                                    onChange={(event) => updateFilters({ overdue_only: event.target.value === '1' })}
                                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-[120px] rounded-md border bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                >
                                    <option value="0">Show all</option>
                                    <option value="1">Overdue only</option>
                                </select>
                            </div>
                        </div>

                        <Button onClick={() => setCreateOpen(true)} className="shrink-0">Create Task</Button>
                    </div>
                </div>

                {/* Horizontal Kanban Board */}
                <div className="flex-1 overflow-hidden p-4 lg:p-6 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex h-full gap-4 md:gap-6 overflow-x-auto board-scroller pb-4">
                        {statuses.map((status) => {
                            const columnTasks = tasksByStatus[status] ?? [];
                            const colColor = TASK_STATUS_COLORS[status as keyof typeof TASK_STATUS_COLORS] || TASK_STATUS_COLORS.ASSIGNED;
                            
                            const columnBgColor = 
                                status === 'ASSIGNED' ? 'bg-orange-100/40 dark:bg-orange-950/30 border-orange-200/50 dark:border-orange-900/50' :
                                status === 'IN_PROGRESS' ? 'bg-blue-100/40 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/50' :
                                status === 'REVIEW' ? 'bg-purple-100/40 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-900/50' :
                                status === 'DONE' ? 'bg-green-100/40 dark:bg-green-950/30 border-green-200/50 dark:border-green-900/50' : 'bg-card';

                            return (
                                <div
                                    key={status}
                                    className={cn("flex flex-col min-w-[340px] max-w-[340px] rounded-xl border shadow-sm overflow-hidden", columnBgColor)}
                                >
                                    <div 
                                        className={cn("flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5", colColor.bg)}
                                        style={{ backgroundColor: typeof colColor.bg === 'string' && /^#/.test(colColor.bg) ? colColor.bg : undefined }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", colColor.badge.split(' ')[0])} />
                                            <p className={cn("text-sm font-bold uppercase tracking-wider", colColor.text)}>
                                                {status.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="bg-white/60 dark:bg-black/20 font-mono shadow-sm">
                                            {columnTasks.length}
                                        </Badge>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                        {columnTasks.map((task) => (
                                            <AdminTaskCard 
                                                key={task.id} 
                                                task={task} 
                                                onEdit={startEditTask}
                                                onStatusChange={updateTaskStatus}
                                                statuses={statuses}
                                                renderAssignee={renderAssignee}
                                            />
                                        ))}

                                        {columnTasks.length === 0 && (
                                            <div className="flex h-32 items-center justify-center border-2 border-dashed border-border/60 rounded-lg mx-2 mt-2">
                                                <p className="text-sm font-medium text-muted-foreground">No tasks</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                        <DialogDescription>
                            Fill in the task details below.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                                required
                            />
                            <InputError message={errors.title} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="assigned_to">Assigned Employee</Label>
                            <select
                                id="assigned_to"
                                value={data.assigned_to}
                                onChange={(event) =>
                                    setData('assigned_to', event.target.value)
                                }
                                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                required
                            >
                                <option value="">Select employee</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.full_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.assigned_to} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(event) =>
                                    setData('status', event.target.value)
                                }
                                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            >
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.status} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <select
                                id="priority"
                                value={data.priority}
                                onChange={(event) =>
                                    setData('priority', event.target.value)
                                }
                                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            >
                                {priorities.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priority}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.priority} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="due_at">Due date/time</Label>
                            <Input
                                id="due_at"
                                type="datetime-local"
                                value={data.due_at}
                                onChange={(event) =>
                                    setData('due_at', event.target.value)
                                }
                            />
                            <InputError message={errors.due_at} />
                        </div>

                        <DialogFooter className="md:col-span-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Create Task
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editingTaskId !== null} onOpenChange={(open) => !open && cancelEdit()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                            Update the task details below.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEditTask} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={editData.title}
                                onChange={(event) =>
                                    setEditData('title', event.target.value)
                                }
                                required
                            />
                            <InputError message={editErrors.title} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <textarea
                                id="edit-description"
                                value={editData.description}
                                onChange={(event) =>
                                    setEditData('description', event.target.value)
                                }
                                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            />
                            <InputError message={editErrors.description} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-priority">Priority</Label>
                            <select
                                id="edit-priority"
                                value={editData.priority}
                                onChange={(event) =>
                                    setEditData('priority', event.target.value)
                                }
                                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                required
                            >
                                <option value="">Select priority</option>
                                {priorities.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priority}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editErrors.priority} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-due-at">Due date/time</Label>
                            <Input
                                id="edit-due-at"
                                type="datetime-local"
                                value={editData.due_at}
                                onChange={(event) =>
                                    setEditData('due_at', event.target.value)
                                }
                            />
                            <InputError message={editErrors.due_at} />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={cancelEdit}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editProcessing}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
