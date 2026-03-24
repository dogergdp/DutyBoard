import { useEffect, useState } from 'react';

export const useBoardState = () => {
    const [expandedTaskIds, setExpandedTaskIds] = useState<number[]>([]);
    const [manilaNow, setManilaNow] = useState(() => new Date());

    const toggleTaskExpanded = (taskId: number) => {
        setExpandedTaskIds((current) =>
            current.includes(taskId)
                ? current.filter((id) => id !== taskId)
                : [...current, taskId],
        );
    };

    useEffect(() => {
        const interval = window.setInterval(() => {
            setManilaNow(new Date());
        }, 60_000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    return {
        expandedTaskIds,
        manilaNow,
        toggleTaskExpanded,
    };
};
