import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import admin from '@/routes/admin';
import taskRoutes from '@/routes/tasks';
import type { BreadcrumbItem } from '@/types';

type Employee = {
    id: number;
    full_name: string;
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
            employee_id: next.employee_id ?? filters.employee_id ?? '',
            status: next.status ?? filters.status ?? '',
            overdue_only: next.overdue_only ?? filters.overdue_only,
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

                <Card>
                    <CardHeader>
                        <CardTitle>Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
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

                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {statuses.map((status) => {
                                const columnTasks = tasksByStatus[status] ?? [];

                                return (
                                    <div key={status} className="min-w-[320px] flex-1 space-y-3">
                                        <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                            <p className="text-sm font-semibold">{status.replace('_', ' ')}</p>
                                            <Badge variant="outline">{columnTasks.length}</Badge>
                                        </div>

                                        <div className="space-y-3">
                                            {columnTasks.map((task) => {
                                                const dueAt = task.due_at ? new Date(task.due_at) : null;
                                                const overdue = dueAt !== null && task.status !== 'DONE' && dueAt < new Date();

                                                return (
                                                    <div key={task.id} className="rounded-md border p-4">
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
                                                                <p className="text-sm text-muted-foreground">
                                                                    Assigned to: {task.employee?.full_name ?? 'Unknown'}
                                                                </p>
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
                                                                    <Badge variant="secondary">{task.priority}</Badge>
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

                        {tasks.length === 0 && (
                            <p className="text-sm text-muted-foreground">No tasks found for the selected filters.</p>
                        )}
                    </CardContent>
                </Card>
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
