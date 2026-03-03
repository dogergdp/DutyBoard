import { Head, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { employees, tasks } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Task {
    id: number;
    name: string;
    description: string;
    deadline: string;
}

interface Employee {
    id: number;
    name: string;
    email: string;
    tasks: Task[];
}

interface Props {
    employees: Employee[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: employees.index().url,
    },
];

export default function Index({ employees: employeeList }: Props) {
    const { data: employeeData, setData: setEmployeeData, post: postEmployee, processing: processingEmployee, reset: resetEmployee, errors: employeeErrors } = useForm({
        name: '',
        email: '',
    });

    const { data: taskData, setData: setTaskData, post: postTask, processing: processingTask, reset: resetTask, errors: taskErrors } = useForm({
        employee_id: '',
        name: '',
        description: '',
        deadline: '',
    });

    const submitEmployee: FormEventHandler = (e) => {
        e.preventDefault();
        postEmployee(employees.store().url, {
            onSuccess: () => resetEmployee(),
        });
    };

    const submitTask: FormEventHandler = (e) => {
        e.preventDefault();
        postTask(tasks.store().url, {
            onSuccess: () => resetTask(),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees & Tasks" />
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Create Employee Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Employee</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitEmployee} className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={employeeData.name}
                                        onChange={(e) => setEmployeeData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={employeeErrors.name} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={employeeData.email}
                                        onChange={(e) => setEmployeeData('email', e.target.value)}
                                        required
                                    />
                                    <InputError message={employeeErrors.email} className="mt-2" />
                                </div>
                                <Button type="submit" disabled={processingEmployee}>
                                    Add Employee
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Create Task Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Assign Task</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitTask} className="space-y-4">
                                <div>
                                    <Label htmlFor="employee_id">Employee</Label>
                                    <select
                                        id="employee_id"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        value={taskData.employee_id}
                                        onChange={(e) => setTaskData('employee_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Employee</option>
                                        {employeeList.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={taskErrors.employee_id} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="task_name">Task Name</Label>
                                    <Input
                                        id="task_name"
                                        value={taskData.name}
                                        onChange={(e) => setTaskData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={taskErrors.name} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={taskData.description}
                                        onChange={(e) => setTaskData('description', e.target.value)}
                                        required
                                    />
                                    <InputError message={taskErrors.description} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="deadline">Deadline</Label>
                                    <Input
                                        id="deadline"
                                        type="date"
                                        value={taskData.deadline}
                                        onChange={(e) => setTaskData('deadline', e.target.value)}
                                        required
                                    />
                                    <InputError message={taskErrors.deadline} className="mt-2" />
                                </div>
                                <Button type="submit" disabled={processingTask}>
                                    Assign Task
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Employees and Tasks List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Employees & Tasks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {employeeList.map((employee) => (
                            <Card key={employee.id}>
                                <CardHeader>
                                    <CardTitle>{employee.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                                </CardHeader>
                                <CardContent>
                                    <h3 className="font-semibold mb-2">Tasks:</h3>
                                    {employee.tasks.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                            {employee.tasks.map((task) => (
                                                <li key={task.id} className="text-sm">
                                                    <strong>{task.name}</strong> - {task.deadline}
                                                    <p className="text-xs text-muted-foreground">{task.description}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No tasks assigned.</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
