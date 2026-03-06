import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { isPast } from 'date-fns';
import { getEmployeeColor } from '../utils/employee-colors';
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
    currentTime?: Date;
}

export default function EmployeeColumn({
    employee,
    animatedEmployeeId,
    animatedTaskIds,
    flippedTaskIds,
    disappearingTaskIds,
    expandedTaskIds,
    toggleTaskExpanded,
    currentTime = new Date(),
}: EmployeeColumnProps) {
    const getInitials = useInitials();
    const employeeColor = getEmployeeColor(employee.id);
    const visibleTasks = employee.tasks.filter(
        (task) => task.status !== 'DONE' || disappearingTaskIds.includes(task.id),
    );

    return (
        <div key={employee.id} className="relative min-w-[420px] max-w-[420px] 2xl:min-w-[520px] 2xl:max-w-[520px]">
            <div
                className={cn(
                    'pointer-events-none absolute -left-3 top-4 -bottom-2 w-3 rounded-l-xl shadow-sm',
                    employeeColor.sideDepth,
                )}
            />
            <div
                className={cn(
                    'relative z-10 flex h-full flex-col rounded-xl border p-5 shadow-sm 2xl:p-6',
                    animatedEmployeeId === employee.id ? 'animate-column-slide' : '',
                    employeeColor.bg,
                    employeeColor.accent,
                )}
            >
            <div className={cn('mb-5 flex items-center justify-between border-b pb-3 2xl:mb-6', employeeColor.accent)}>
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/10 2xl:h-16 2xl:w-16">
                        <AvatarImage src={employee.photo_path || ''} alt={employee.full_name} />
                        <AvatarFallback className={cn('text-lg 2xl:text-xl', employeeColor.textAccent, employeeColor.sideDepth)}>
                            {getInitials(employee.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className={cn('text-lg leading-tight font-semibold 2xl:text-xl', employeeColor.textAccent)}>
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
                {visibleTasks.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                        <p className={cn('text-3xl font-bold 2xl:text-4xl', employeeColor.textAccent)}>No tasks</p>
                    </div>
                ) : (
                    visibleTasks.map((task) => {
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
                                currentTime={currentTime}
                            />
                        );
                    })
                )}
            </div>
            </div>
        </div>
    );
}
