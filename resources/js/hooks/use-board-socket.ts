import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import type { ApiBoardPayload, Employee, Task, TaskSnapshot } from '@/pages/board/types';

interface BoardSocketResult {
    liveEmployees: Employee[];
    animatedEmployeeId: number | null;
    animatedTaskIds: number[];
    flippedTaskIds: number[];
    disappearingTaskIds: number[];
}

/**
 * Manage the socket connection that keeps the board up to date.
 *
 * The hook owns all of the animation state and returns it so the
 * consumer can pass the arrays down to presentation components.
 */
export function useBoardSocket(
    initialEmployees: Employee[],
    playStatusSound: (status: string) => void,
): BoardSocketResult {
    const [liveEmployees, setLiveEmployees] = useState<Employee[]>(initialEmployees);
    const [animatedEmployeeId, setAnimatedEmployeeId] = useState<number | null>(null);
    const [animatedTaskIds, setAnimatedTaskIds] = useState<number[]>([]);
    const [flippedTaskIds, setFlippedTaskIds] = useState<number[]>([]);
    const [disappearingTaskIds, setDisappearingTaskIds] = useState<number[]>([]);

    const previousTasksRef = useRef<TaskSnapshot>({});
    const previousEmployeeIdRef = useRef<number | null>(null);
    const hasReceivedFirstUpdateRef = useRef(false);

    const socketUrl = useMemo(
        () => import.meta.env.VITE_SOCKET_URL ?? 'http://127.0.0.1:4001',
        [],
    );

    useEffect(() => {
        const socket = io(socketUrl, {
            transports: ['websocket'],
        });

        socket.on('board:update', (payload: ApiBoardPayload) => {
            if (!payload?.ok) {
                return;
            }

            const nextSnapshot: TaskSnapshot = {};
            const taskIdsToAnimate: number[] = [];
            const taskIdsToFlip: number[] = [];
            const statusesToPlay: string[] = [];
            const tasksBecomingDone: number[] = [];

            payload.tasks.forEach((task) => {
                nextSnapshot[task.id] = {
                    status: task.status,
                    assigned_to: task.assigned_to,
                    updated_at: task.updated_at,
                };

                const previousTask = previousTasksRef.current[task.id];

                if (!previousTask) {
                    taskIdsToAnimate.push(task.id);
                    statusesToPlay.push(task.status);
                    return;
                }

                if (previousTask.assigned_to !== task.assigned_to) {
                    taskIdsToAnimate.push(task.id);
                }

                if (previousTask.updated_at !== task.updated_at) {
                    taskIdsToFlip.push(task.id);
                    statusesToPlay.push(task.status);

                    // Track tasks that are becoming DONE
                    if (previousTask.status !== 'DONE' && task.status === 'DONE') {
                        tasksBecomingDone.push(task.id);
                    }
                }
            });

            const tasksByEmployee = payload.tasks.reduce<Record<number, Task[]>>(
                (accumulator, task) => {
                    if (!accumulator[task.assigned_to]) {
                        accumulator[task.assigned_to] = [];
                    }

                    accumulator[task.assigned_to].push({
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        due_at: task.due_at,
                        created_at: task.created_at,
                        updated_at: task.updated_at,
                    });

                    return accumulator;
                },
                {},
            );

            let nextEmployees = payload.employees.map((employee) => ({
                id: employee.id,
                full_name: employee.full_name,
                photo_path: employee.photo_path,
                tasks: tasksByEmployee[employee.id] ?? [],
            }));

            // reorder by most recent update
            const withRecent = nextEmployees.map((emp) => {
                const last = emp.tasks.reduce((max, t) => {
                    const ts = new Date(t.updated_at).getTime();
                    return ts > max ? ts : max;
                }, 0);
                return { ...emp, lastUpdate: last };
            });

            withRecent.sort((a, b) => b.lastUpdate - a.lastUpdate);
            nextEmployees = withRecent.map((e) => ({
                id: e.id,
                full_name: e.full_name,
                photo_path: e.photo_path,
                tasks: e.tasks,
            }));

            previousTasksRef.current = nextSnapshot;

            const nextTopEmployeeId = nextEmployees[0]?.id ?? null;
            if (previousEmployeeIdRef.current !== nextTopEmployeeId) {
                previousEmployeeIdRef.current = nextTopEmployeeId;
                setAnimatedEmployeeId(nextTopEmployeeId);
                window.setTimeout(() => {
                    setAnimatedEmployeeId(null);
                }, 1600);
            }

            setLiveEmployees(nextEmployees);

            if (taskIdsToAnimate.length > 0) {
                const uniqueTaskIds = [...new Set(taskIdsToAnimate)];

                setAnimatedTaskIds((current) =>
                    Array.from(new Set([...current, ...uniqueTaskIds])),
                );

                window.setTimeout(() => {
                    setAnimatedTaskIds((current) =>
                        current.filter((id) => !uniqueTaskIds.includes(id)),
                    );
                }, 1600);
            }

            if (taskIdsToFlip.length > 0) {
                const uniqueTaskIds = [...new Set(taskIdsToFlip)];

                setFlippedTaskIds((current) =>
                    Array.from(new Set([...current, ...uniqueTaskIds])),
                );

                window.setTimeout(() => {
                    setFlippedTaskIds((current) =>
                        current.filter((id) => !uniqueTaskIds.includes(id)),
                    );
                }, 900);
            }

            if (tasksBecomingDone.length > 0) {
                void confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    gravity: 0.8,
                    ticks: 400,
                });

                setDisappearingTaskIds((current) =>
                    Array.from(new Set([...current, ...tasksBecomingDone])),
                );

                window.setTimeout(() => {
                    setDisappearingTaskIds((current) =>
                        current.filter((id) => !tasksBecomingDone.includes(id)),
                    );
                }, 800);
            }

            [...new Set(statusesToPlay)].forEach((status) =>
                playStatusSound(status),
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [socketUrl, playStatusSound]);

    return {
        liveEmployees,
        animatedEmployeeId,
        animatedTaskIds,
        flippedTaskIds,
        disappearingTaskIds,
    };
}
