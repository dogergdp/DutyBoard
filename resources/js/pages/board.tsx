import { Head, router } from '@inertiajs/react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { updateStatus } from '@/routes/tasks';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_at: string | null;
    created_at: string;
}

interface Employee {
    id: number;
    full_name: string;
    photo_path: string | null;
    tasks: Task[];
}

interface BoardProps {
    employees: Employee[];
    statuses: string[];
    priorities: string[];
}

export default function Board({ employees, statuses }: BoardProps) {
    const getInitials = useInitials();

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'DONE': return 'default';
            case 'IN_PROGRESS': return 'secondary';
            case 'REVIEW': return 'outline';
            case 'BLOCKED': return 'destructive';
            default: return 'outline';
        }
    };

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'destructive';
            case 'HIGH': return 'default';
            case 'MED': return 'secondary';
            default: return 'outline';
        }
    };

    const handleStatusChange = (taskId: number, newStatus: string) => {
        router.patch(updateStatus.url(taskId), {
            status: newStatus
        }, {
            preserveScroll: true
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Board', href: '/board' }]}>
            <Head title="Task Board" />
            <div className="flex h-full flex-col p-6 overflow-hidden">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Project Board</h1>
                    <p className="text-muted-foreground">Manage tasks across all employees.</p>
                </div>

                <div className="flex flex-1 gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    {employees.map((employee) => (
                        <div key={employee.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-muted/30 rounded-lg p-4 h-full border border-border">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                                        <AvatarImage src={employee.photo_path || ''} alt={employee.full_name} />
                                        <AvatarFallback className="bg-primary/5 text-primary">
                                            {getInitials(employee.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm leading-tight">{employee.full_name}</span>
                                        <span className="text-xs text-muted-foreground">{employee.tasks.length} {employee.tasks.length === 1 ? 'task' : 'tasks'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                                {employee.tasks.map((task) => {
                                    const overdue = task.due_at && isPast(new Date(task.due_at)) && task.status !== 'DONE';
                                    const age = formatDistanceToNow(new Date(task.created_at), { addSuffix: true });

                                    return (
                                        <Card key={task.id} className={cn(
                                            "shadow-sm hover:shadow-md transition-all border-l-4",
                                            overdue ? "border-l-destructive ring-1 ring-destructive/20 animate-pulse-light shadow-destructive/10" : "border-l-primary/30"
                                        )}>
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <CardTitle className="text-sm font-bold leading-tight">{task.title}</CardTitle>
                                                    {overdue && (
                                                        <Badge variant="destructive" className="text-[10px] uppercase font-bold animate-pulse px-1.5 py-0 h-4">
                                                            Overdue
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-3">
                                                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>

                                                <div className="flex flex-wrap gap-1.5">
                                                    <Badge variant={getStatusVariant(task.status)} className="text-[10px] font-medium px-2 py-0">
                                                        {task.status}
                                                    </Badge>
                                                    <Badge variant={getPriorityVariant(task.priority)} className="text-[10px] font-medium px-2 py-0">
                                                        {task.priority}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground flex items-center ml-auto">
                                                        {age}
                                                    </span>
                                                </div>

                                                {task.due_at && (
                                                    <div className={cn(
                                                        "text-[10px] font-semibold py-1 px-2 rounded bg-muted/50 flex items-center justify-between",
                                                        overdue ? "text-destructive" : "text-muted-foreground"
                                                    )}>
                                                        <span>Due: {format(new Date(task.due_at), 'MMM d, h:mm a')}</span>
                                                    </div>
                                                )}

                                                <div className="pt-2 border-t border-border mt-2">
                                                    <Select value={task.status} onValueChange={(val) => handleStatusChange(task.id, val)}>
                                                        <SelectTrigger className="h-8 text-xs font-medium bg-background">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statuses.map(s => (
                                                                <SelectItem key={s} value={s} className="text-xs font-medium">{s}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                                {employee.tasks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-40 border-2 border-dashed border-border rounded-lg">
                                        <p className="text-xs italic">No tasks assigned</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse-light {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.95; transform: scale(1.005); box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
                }
                .animate-pulse-light {
                    animation: pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}} />
        </AppLayout>
    );
}
