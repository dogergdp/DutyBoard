import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Employee = {
    id: number;
    full_name: string;
    mobile: string | null;
};

type Task = {
    id: number;
    title: string;
    description: string;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    priority: 'LOW' | 'MED' | 'HIGH' | 'URGENT';
    due_at: string | null;
};

type Props = {
    employee: Employee;
    tasks: Task[];
};

export default function EmployeeTasks({ employee, tasks }: Props) {
    const updateStatus = (taskId: number, status: 'IN_PROGRESS' | 'REVIEW') => {
        router.patch(`/employee/tasks/${taskId}/status`, { status }, { preserveScroll: true });
    };

    const logout = () => {
        router.post('/logout');
    };

    // Group tasks by status
    const statusColumns: { [key: string]: string } = {
        ASSIGNED: 'Assigned',
        IN_PROGRESS: 'In Progress',
        REVIEW: 'Review',
        DONE: 'Done',
    };

    const groupedTasks: { [key: string]: Task[] } = {};
    Object.keys(statusColumns).forEach((status) => {
        groupedTasks[status] = tasks.filter((task) => task.status === status);
    });

    return (
        <>
            <Head title="My Tasks" />

            <div className="mx-auto max-w-7xl space-y-6 p-6">
                {/* Header/Filters Section */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">My Tasks</h1>
                        <p className="text-sm text-muted-foreground">{employee.full_name}</p>
                    </div>
                    <Button type="button" variant="outline" onClick={logout}>
                        Log out
                    </Button>
                </div>

                {/* Kanban Board Section */}
                <Card className="mt-4">
                    <CardContent className="p-0">
                        <div className="h-[60vh] overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {Object.entries(statusColumns).map(([status, label]) => (
                                    <Card key={status} className="flex flex-col h-full">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{label}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col gap-3">
                                            {groupedTasks[status].length === 0 ? (
                                                <div className="text-sm text-muted-foreground py-4">No tasks</div>
                                            ) : (
                                                groupedTasks[status].map((task) => {
                                                    const dueAt = task.due_at ? new Date(task.due_at) : null;
                                                    return (
                                                        <Card key={task.id} className="border border-muted-foreground/10">
                                                            <CardHeader className="space-y-2 pb-2">
                                                                <CardTitle className="text-base">{task.title}</CardTitle>
                                                                <div className="flex gap-2">
                                                                    <Badge variant="secondary">{task.priority}</Badge>
                                                                    <Badge variant="outline">{task.status}</Badge>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="space-y-2 pt-0">
                                                                {task.description && (
                                                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                                                )}
                                                                {dueAt && (
                                                                    <p className="text-xs text-muted-foreground">Due: {dueAt.toLocaleString()}</p>
                                                                )}
                                                                {(task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS' || task.status === 'REVIEW') && (
                                                                    <div className="flex gap-2 pt-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant={task.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                                                                            onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                                                                            disabled={task.status === 'IN_PROGRESS'}
                                                                        >
                                                                            On it
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant={task.status === 'REVIEW' ? 'default' : 'outline'}
                                                                            onClick={() => updateStatus(task.id, 'REVIEW')}
                                                                            disabled={task.status === 'REVIEW'}
                                                                        >
                                                                            Put up for review
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
