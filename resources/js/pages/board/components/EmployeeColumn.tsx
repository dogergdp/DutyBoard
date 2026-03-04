import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { isPast } from 'date-fns';
import type { Employee, Task } from '../types';
import TaskCard from './TaskCard';

interface EmployeeColumnProps {
    employee: Employee;
    animatedEmployeeId: number | null;
    animatedTaskIds: number[];
    flippedTaskIds: number[];
    disappearingTaskIds: number[];
    expandedTaskIds: number[];
    toggleTaskExpanded: (id: number) => void;
}

export default function EmployeeColumn({
    employee,
    animatedEmployeeId,
    animatedTaskIds,
    flippedTaskIds,
    disappearingTaskIds,
    expandedTaskIds,
    toggleTaskExpanded,
}: EmployeeColumnProps) {
    const getInitials = useInitials();

    return (
        <div
            key={employee.id}
            className={cn(
                'flex h-full min-w-[420px] max-w-[420px] flex-col rounded-xl border border-border bg-muted/30 p-5 2xl:min-w-[520px] 2xl:max-w-[520px] 2xl:p-6',
                animatedEmployeeId === employee.id ? 'animate-column-slide' : '',
            )}
        >
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3 2xl:mb-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/10 2xl:h-16 2xl:w-16">
                        <AvatarImage src={employee.photo_path || ''} alt={employee.full_name} />
                        <AvatarFallback className="bg-primary/5 text-lg text-primary 2xl:text-xl">
                            {getInitials(employee.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-lg leading-tight font-semibold 2xl:text-xl">
                            {employee.full_name}
                        </span>
                        <span className="text-sm text-muted-foreground 2xl:text-base">
                            {employee.tasks.filter((t) => t.status !== 'DONE').length}{' '}
                            {employee.tasks.filter((t) => t.status !== 'DONE').length === 1 ?
                                'task' : 'tasks'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
                {employee.tasks
                    .filter((task) => task.status !== 'DONE' || disappearingTaskIds.includes(task.id))
                    .map((task) => {
                        const isExpanded = expandedTaskIds.includes(task.id);
                        return (
                            <TaskCard
                                key={task.id}
                                task={task}
                                expanded={isExpanded}
                                onToggle={() => toggleTaskExpanded(task.id)}
                                animated={animatedTaskIds.includes(task.id)}
                                flipped={flippedTaskIds.includes(task.id)}
                                disappearing={disappearingTaskIds.includes(task.id)}
                            />
                        );
                    })}
                {employee.tasks.filter((t) => t.status !== 'DONE' || disappearingTaskIds.includes(t.id)).length ===
                    0 && (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center opacity-40">
                        <p className="text-sm italic 2xl:text-base">No tasks</p>
                    </div>
                )}
            </div>
        </div>
    );
}
