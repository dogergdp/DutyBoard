import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
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
    employee: Employee;
};

type Filters = {
    employee_id: string | null;
    status: string | null;
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

export default function AdminTasks({ tasks, employees, statuses, priorities, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editProcessing, setEditProcessing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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
            <Avatar className="h-8 w-8">
                <AvatarImage src={employee?.photo_url ?? undefined} alt={employee?.full_name ?? 'Unknown'} />
                <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-700">
                    {getInitials(employee?.full_name ?? '')}
                </AvatarFallback>
            </Avatar>
            <span>{employee?.full_name ?? 'Unknown'}</span>
        </div>
    );

    const statusStyles: Record<string, { pill: string; header: string; badge: string }> = {
        ASSIGNED: {
            pill: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:border-amber-500 dark:hover:bg-amber-600',
            header: 'bg-amber-500/15 border-amber-500/60 text-amber-950 dark:bg-amber-500/20 dark:border-amber-400/60 dark:text-amber-50',
            badge: 'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950',
        },
        IN_PROGRESS: {
            pill: 'bg-sky-500 text-white border-sky-500 hover:bg-sky-600 dark:bg-sky-500 dark:border-sky-500 dark:hover:bg-sky-600',
            header: 'bg-sky-500/15 border-sky-500/60 text-sky-950 dark:bg-sky-500/20 dark:border-sky-400/60 dark:text-sky-50',
            badge: 'bg-sky-500 text-white dark:bg-sky-400 dark:text-sky-950',
        },
        REVIEW: {
            pill: 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:border-purple-600 dark:hover:bg-purple-700',
            header: 'bg-purple-600/15 border-purple-600/60 text-purple-950 dark:bg-purple-600/20 dark:border-purple-400/60 dark:text-purple-50',
            badge: 'bg-purple-600 text-white dark:bg-purple-400 dark:text-purple-950',
        },
        DONE: {
            pill: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:border-emerald-500 dark:hover:bg-emerald-600',
            header: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-950 dark:bg-emerald-500/20 dark:border-emerald-400/60 dark:text-emerald-50',
            badge: 'bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950',
        },
        ALL: {
            pill: 'bg-white text-muted-foreground border-border hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700',
            header: 'bg-white border-border text-foreground dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100',
            badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        },
    };

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
            status: 'status' in next ? next.status ?? '' : filters.status ?? '',
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

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-end">
                    <Button onClick={() => setCreateOpen(true)}>Create Task</Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="filter-employee">Filter by employee</Label>
                                    <select
                                        id="filter-employee"
                                        value={filters.employee_id ?? ''}
                                        onChange={(event) => updateFilters({ employee_id: event.target.value || null })}
                                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                    >
                                        <option value="">All employees</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="filter-status">Filter by status</Label>
                                    <select
                                        id="filter-status"
                                        value={filters.status ?? ''}
                                        onChange={(event) => updateFilters({ status: event.target.value || null })}
                                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                    >
                                        <option value="">All statuses</option>
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="filter-overdue">Overdue only</Label>
                                    <select
                                        id="filter-overdue"
                                        value={filters.overdue_only ? '1' : '0'}
                                        onChange={(event) => updateFilters({ overdue_only: event.target.value === '1' })}
                                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                    >
                                        <option value="0">No</option>
                                        <option value="1">Yes</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status Pill Navigation */}
                            <div className="flex flex-wrap items-center gap-3">
                                {[{ label: 'All', value: null }, ...statuses.map((status) => ({
                                    label: status.replace('_', ' '),
                                    value: status,
                                }))].map((item) => {
                                    const isActive = item.value === selectedStatus || (item.value === null && selectedStatus === null);
                                    const count = item.value ? tasksByStatus[item.value]?.length ?? 0 : tasks.length;
                                    const styleKey = item.value ?? 'ALL';
                                    const style = statusStyles[styleKey] ?? statusStyles.ALL;

                                    return (
                                        <button
                                            key={item.value ?? 'all'}
                                            type="button"
                                            onClick={() => setSelectedStatus(item.value)}
                                            className={cn(
                                                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 border',
                                                isActive
                                                    ? style.pill
                                                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-slate-50 hover:text-foreground'
                                            )}
                                        >
                                            <span className="capitalize">{item.label.toLowerCase()}</span>
                                            <span className={cn(
                                                'text-xs',
                                                isActive ? '' : 'text-muted-foreground'
                                            )}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Kanban Board Section */}
                            <div className="mt-2 space-y-3">
                                {selectedStatus ? (
                                    // Single Status View
                                    <div className="space-y-3">
                                        {tasksByStatus[selectedStatus]?.map((task) => {
                                            const dueAt = task.due_at ? new Date(task.due_at) : null;
                                            const overdue = dueAt !== null && task.status !== 'DONE' && dueAt < new Date();
                                            const style = statusStyles[task.status] ?? statusStyles.ALL;

                                            return (
                                                <div key={task.id} className={cn('rounded-md border p-4', style.header)}>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <p className="font-medium">{task.title}</p>
                                                            <div className="min-h-10 max-h-10">
                                                                {task.description && (
                                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {renderAssignee(task.employee)}
                                                            {task.due_at && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Due: {dueAt?.toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={task.status}
                                                                    onChange={(event) =>
                                                                        updateTaskStatus(task.id, event.target.value)
                                                                    }
                                                                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-md border bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:ring-[3px]"
                                                                >
                                                                    {statuses.map((nextStatus) => (
                                                                        <option key={nextStatus} value={nextStatus}>
                                                                            {nextStatus}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <Badge className={style.badge}>{task.priority}</Badge>
                                                                {overdue && <Badge variant="destructive">Overdue</Badge>}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => startEditTask(task)}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            {task.status === 'REVIEW' && (
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => updateTaskStatus(task.id, 'DONE')}
                                                                    className="h-8 px-3 text-xs"
                                                                >
                                                                    Approve
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {tasksByStatus[selectedStatus]?.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No tasks in this status.</p>
                                        )}
                                    </div>
                                ) : (
                                    // Multi-Status View: vertical on mobile, horizontal kanban on desktop
                                    <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:overflow-x-auto">
                                        {statuses.map((status) => {
                                            const columnTasks = tasksByStatus[status] ?? [];
                                            const style = statusStyles[status] ?? statusStyles.ALL;

                                            return (
                                                <div
                                                    key={status}
                                                    className={cn(
                                                        'rounded-md border min-w-[300px] flex-1',
                                                        style.header
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between px-3 py-2">
                                                        <p className="text-sm font-semibold capitalize">{status.replace('_', ' ').toLowerCase()}</p>
                                                        <Badge className={style.badge}>{columnTasks.length}</Badge>
                                                    </div>

                                                    <div className="space-y-3 border-t border-dashed border-border/60 bg-white/60 dark:bg-slate-900/40 p-3">
                                                        {columnTasks.map((task) => {
                                                            const dueAt = task.due_at ? new Date(task.due_at) : null;
                                                            const overdue = dueAt !== null && task.status !== 'DONE' && dueAt < new Date();

                                                            return (
                                                                <div key={task.id} className="rounded-md border bg-white dark:bg-slate-900 p-4 shadow-xs">
                                                                    <div className="flex items-start justify-between gap-4">
                                                                        <div className="flex-1 space-y-2">
                                                                            <p className="font-medium">{task.title}</p>
                                                                            <div className="min-h-10 max-h-10">
                                                                                {task.description && (
                                                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                                                        {task.description}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            {renderAssignee(task.employee)}
                                                                            {task.due_at && (
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Due: {dueAt?.toLocaleString()}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <select
                                                                                    value={task.status}
                                                                                    onChange={(event) =>
                                                                                        updateTaskStatus(task.id, event.target.value)
                                                                                    }
                                                                                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-md border bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:ring-[3px]"
                                                                                >
                                                                                    {statuses.map((nextStatus) => (
                                                                                        <option key={nextStatus} value={nextStatus}>
                                                                                            {nextStatus}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                <Badge className={style.badge}>{task.priority}</Badge>
                                                                                {overdue && <Badge variant="destructive">Overdue</Badge>}
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => startEditTask(task)}
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>
                                                                            {task.status === 'REVIEW' && (
                                                                                <Button
                                                                                    variant="default"
                                                                                    size="sm"
                                                                                    onClick={() => updateTaskStatus(task.id, 'DONE')}
                                                                                    className="h-8 px-3 text-xs"
                                                                                >
                                                                                    Approve
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {columnTasks.length === 0 && (
                                                            <p className="text-sm text-muted-foreground">No tasks</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {tasks.length === 0 && (
                                <p className="text-sm text-muted-foreground">No tasks found for the selected filters.</p>
                            )}
                        </CardContent>
                    </Card>
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
