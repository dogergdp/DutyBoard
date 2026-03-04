import { useMemo } from 'react';

import type { Employee } from '../types';

export const useLeaderboardData = (employees: Employee[]) => {
    return useMemo(() => {
        return employees
            .map((employee) => ({
                id: employee.id,
                full_name: employee.full_name,
                photo_path: employee.photo_path,
                done_count: employee.tasks.filter(task => task.status === 'DONE').length,
            }))
            .sort((a, b) => b.done_count - a.done_count);
    }, [employees]);
};
