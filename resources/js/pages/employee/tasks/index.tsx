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

    return (
        <>
            <Head title="My Tasks" />

            <div className="mx-auto max-w-5xl space-y-6 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">My Tasks</h1>
                        <p className="text-sm text-muted-foreground">{employee.full_name}</p>
                    </div>
                    <Button type="button" variant="outline" onClick={logout}>
                        Log out
                    </Button>
                </div>

                <div className="grid gap-4">
                    {tasks.map((task) => {
                        const dueAt = task.due_at ? new Date(task.due_at) : null;

                        return (
                            <Card key={task.id}>
                                <CardHeader className="space-y-2">
                                    <CardTitle className="text-base">{task.title}</CardTitle>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary">{task.priority}</Badge>
                                        <Badge variant="outline">{task.status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {task.description && (
                                        <p className="text-sm text-muted-foreground">{task.description}</p>
                                    )}

                                    {dueAt && (
                                        <p className="text-sm text-muted-foreground">
                                            Due: {dueAt.toLocaleString()}
                                        </p>
                                    )}

                                    <div className="flex gap-2">
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
                                </CardContent>
                            </Card>
                        );
                    })}

                    {tasks.length === 0 && (
                        <Card>
                            <CardContent className="py-8 text-sm text-muted-foreground">
                                No tasks assigned.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
