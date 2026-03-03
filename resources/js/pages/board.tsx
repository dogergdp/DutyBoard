import { Head } from '@inertiajs/react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Employee {
    id: number;
    full_name: string;
    photo_path: string | null;
    tasks: Task[];
}

interface BoardProps {
    employees: Employee[];
    priorities: string[];
}

interface ApiBoardEmployee {
    id: number;
    full_name: string;
    photo_path: string | null;
}

interface ApiBoardTask {
    id: number;
    title: string;
    description: string;
    assigned_to: number;
    status: string;
    priority: string;
    due_at: string | null;
    created_at: string;
    updated_at: string;
    full_name: string;
}

interface ApiBoardPayload {
    ok: boolean;
    employees: ApiBoardEmployee[];
    tasks: ApiBoardTask[];
}

type TaskSnapshot = Record<
    number,
    {
        status: string;
        assigned_to: number;
        updated_at: string;
    }
>;

export default function Board({ employees }: BoardProps) {
    const SOUND_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE'] as const;

    const getInitials = useInitials();
    const [liveEmployees, setLiveEmployees] = useState<Employee[]>(employees);
    const [animatedTaskIds, setAnimatedTaskIds] = useState<number[]>([]);
    const [flippedTaskIds, setFlippedTaskIds] = useState<number[]>([]);
    const [expandedTaskIds, setExpandedTaskIds] = useState<number[]>([]);
    const [soundsReady, setSoundsReady] = useState(false);
    const [soundsUnlocked, setSoundsUnlocked] = useState(false);
    const [soundStatusMessage, setSoundStatusMessage] = useState('');
    const [readySoundCount, setReadySoundCount] = useState(0);
    const [manilaNow, setManilaNow] = useState(() => new Date());
    const previousTasksRef = useRef<TaskSnapshot>({});
    const hasReceivedFirstUpdateRef = useRef(false);
    const soundPlayersRef = useRef<Partial<Record<(typeof SOUND_STATUSES)[number], HTMLAudioElement>>>({});

    const socketUrl = useMemo(
        () => import.meta.env.VITE_SOCKET_URL ?? 'http://127.0.0.1:4001',
        [],
    );

    const soundUrls = useMemo(
        () => ({
            ASSIGNED:
                import.meta.env.VITE_SOUND_ASSIGNED ?? '/sounds/assigned.mp3',
            IN_PROGRESS:
                import.meta.env.VITE_SOUND_IN_PROGRESS ??
                '/sounds/in-progress.mp3',
            REVIEW: import.meta.env.VITE_SOUND_REVIEW ?? '/sounds/review.mp3',
            BLOCKED:
                import.meta.env.VITE_SOUND_BLOCKED ?? '/sounds/blocked.mp3',
            DONE: import.meta.env.VITE_SOUND_DONE ?? '/sounds/done.mp3',
        }),
        [],
    );

    const fallbackSoundUrls = useMemo(
        () => ({
            ASSIGNED: '/sounds/assigned.wav',
            IN_PROGRESS: '/sounds/in-progress.wav',
            REVIEW: '/sounds/review.wav',
            BLOCKED: '/sounds/blocked.wav',
            DONE: '/sounds/done.wav',
        }),
        [],
    );

    const playStatusSound = (status: string) => {
        if (!soundsUnlocked) {
            return;
        }

        const soundKey = status as (typeof SOUND_STATUSES)[number];
        const player = soundPlayersRef.current[soundKey];

        if (!player) {
            return;
        }

        player.pause();
        player.currentTime = 0;
        player.volume = 0.7;
        void player.play().catch(() => {
            setSoundsUnlocked(false);
            setSoundStatusMessage('Sound blocked. Tap Enable Sound.');
        });
    };

    const tryUnlockSounds = async () => {
        const players = SOUND_STATUSES
            .map((status) => soundPlayersRef.current[status])
            .filter((player): player is HTMLAudioElement => Boolean(player));

        if (players.length === 0) {
            setSoundStatusMessage('No sound files loaded.');
            return false;
        }

        try {
            for (const player of players) {
                player.muted = true;
                player.volume = 0;
                player.currentTime = 0;
                await player.play();
                player.pause();
                player.currentTime = 0;
                player.muted = false;
                player.volume = 1;
            }

            setSoundsUnlocked(true);
            setSoundStatusMessage('Sound enabled.');
            return true;
        } catch {
            setSoundsUnlocked(false);
            setSoundStatusMessage('Browser blocked sound. Tap Enable Sound again.');
            return false;
        }
    };

    const formatInManila = (
        value: string | Date,
        options: Intl.DateTimeFormatOptions,
    ) =>
        new Intl.DateTimeFormat('en-PH', {
            timeZone: 'Asia/Manila',
            ...options,
        }).format(typeof value === 'string' ? new Date(value) : value);

    const toggleTaskExpanded = (taskId: number) => {
        setExpandedTaskIds((current) =>
            current.includes(taskId)
                ? current.filter((id) => id !== taskId)
                : [...current, taskId],
        );
    };

    useEffect(() => {
        let cancelled = false;

        const loadAudio = (src: string) =>
            new Promise<HTMLAudioElement>((resolve, reject) => {
                const audio = new Audio(src);
                audio.preload = 'auto';

                const onReady = () => {
                    cleanup();
                    resolve(audio);
                };

                const onError = () => {
                    cleanup();
                    reject(new Error(`Failed to load: ${src}`));
                };

                const cleanup = () => {
                    audio.removeEventListener('canplaythrough', onReady);
                    audio.removeEventListener('error', onError);
                };

                audio.addEventListener('canplaythrough', onReady, {
                    once: true,
                });
                audio.addEventListener('error', onError, { once: true });
                audio.load();
            });

        const preloadSounds = async () => {
            const loadedPlayers: Partial<Record<(typeof SOUND_STATUSES)[number], HTMLAudioElement>> = {};
            let loadedCount = 0;

            for (const status of SOUND_STATUSES) {
                const candidates = [
                    soundUrls[status],
                    fallbackSoundUrls[status],
                ].filter((value, index, array) => value && array.indexOf(value) === index);

                for (const candidate of candidates) {
                    try {
                        const player = await loadAudio(candidate);
                        loadedPlayers[status] = player;
                        loadedCount += 1;
                        if (!cancelled) {
                            setReadySoundCount(loadedCount);
                        }
                        break;
                    } catch {
                        continue;
                    }
                }
            }

            if (cancelled) {
                return;
            }

            soundPlayersRef.current = loadedPlayers;
            setSoundsReady(true);
        };

        void preloadSounds();

        return () => {
            cancelled = true;
        };
    }, [fallbackSoundUrls, soundUrls]);

    useEffect(() => {
        if (!soundsReady || soundsUnlocked) {
            return;
        }

        void tryUnlockSounds();
    }, [soundsReady, soundsUnlocked]);

    useEffect(() => {
        if (!soundsReady || soundsUnlocked) {
            return;
        }

        const unlockOnInteraction = () => {
            void tryUnlockSounds();
        };

        window.addEventListener('pointerdown', unlockOnInteraction, {
            once: true,
        });
        window.addEventListener('keydown', unlockOnInteraction, {
            once: true,
        });

        return () => {
            window.removeEventListener('pointerdown', unlockOnInteraction);
            window.removeEventListener('keydown', unlockOnInteraction);
        };
    }, [soundsReady, soundsUnlocked]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setManilaNow(new Date());
        }, 60_000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const initialSnapshot: TaskSnapshot = {};

        employees.forEach((employee) => {
            employee.tasks.forEach((task) => {
                initialSnapshot[task.id] = {
                    status: task.status,
                    assigned_to: employee.id,
                    updated_at: task.updated_at,
                };
            });
        });

        previousTasksRef.current = initialSnapshot;
        hasReceivedFirstUpdateRef.current = true;
    }, [employees]);

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

            const nextEmployees = payload.employees.map((employee) => ({
                id: employee.id,
                full_name: employee.full_name,
                photo_path: employee.photo_path,
                tasks: tasksByEmployee[employee.id] ?? [],
            }));

            previousTasksRef.current = nextSnapshot;

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

            [...new Set(statusesToPlay)].forEach((status) =>
                playStatusSound(status),
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [socketUrl, soundsUnlocked]);

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

    if (!soundsReady) {
        return (
            <>
                <Head title="Task Board" />
                <div className="flex h-full items-center justify-center p-8">
                    <Card className="w-full max-w-xl border-border/60 bg-background/95">
                        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                            <h2 className="text-2xl font-semibold tracking-tight">Preparing DutyBoard</h2>
                            <p className="text-sm text-muted-foreground">
                                Loading board sounds ({readySoundCount}/{SOUND_STATUSES.length})...
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Task Board" />
            <div className="flex h-full flex-col overflow-hidden p-8 lg:p-10 2xl:p-14">
                <div className="mb-8 flex items-center justify-between gap-6 2xl:mb-10">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl 2xl:text-6xl">DutyBoard</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Manila Time</p>
                        <p className="text-sm font-semibold 2xl:text-base">
                            {formatInManila(manilaNow, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 gap-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 2xl:gap-10">
                    {liveEmployees.map((employee) => (
                        <div key={employee.id} className="flex h-full min-w-[420px] max-w-[420px] flex-col rounded-xl border border-border bg-muted/30 p-5 2xl:min-w-[520px] 2xl:max-w-[520px] 2xl:p-6">
                            <div className="mb-5 flex items-center justify-between border-b border-border pb-3 2xl:mb-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 border-2 border-primary/10 2xl:h-16 2xl:w-16">
                                        <AvatarImage src={employee.photo_path || ''} alt={employee.full_name} />
                                        <AvatarFallback className="bg-primary/5 text-lg text-primary 2xl:text-xl">
                                            {getInitials(employee.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-lg leading-tight font-semibold 2xl:text-xl">{employee.full_name}</span>
                                        <span className="text-sm text-muted-foreground 2xl:text-base">{employee.tasks.length} {employee.tasks.length === 1 ? 'task' : 'tasks'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
                                {employee.tasks.map((task) => {
                                    const overdue = task.due_at && isPast(new Date(task.due_at)) && task.status !== 'DONE';
                                    const age = formatDistanceToNow(new Date(task.created_at), { addSuffix: true });
                                    const isExpanded = expandedTaskIds.includes(task.id);

                                    return (
                                        <Card
                                            key={task.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => toggleTaskExpanded(task.id)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    toggleTaskExpanded(task.id);
                                                }
                                            }}
                                            className={cn(
                                            "shadow-sm hover:shadow-md transition-all border-l-4",
                                            animatedTaskIds.includes(task.id)
                                                ? "animate-task-slide-in"
                                                : "",
                                            flippedTaskIds.includes(task.id)
                                                ? "animate-task-flip"
                                                : "",
                                            overdue ? "border-l-destructive ring-1 ring-destructive/20 animate-pulse-light shadow-destructive/10" : "border-l-primary/30"
                                        )}
                                        >
                                            <CardHeader className="p-3 pb-2 2xl:p-4 2xl:pb-2">
                                                <div className="flex items-start justify-between gap-3">
                                                    <CardTitle className="text-sm leading-tight font-bold 2xl:text-base">{task.title}</CardTitle>
                                                    {overdue && (
                                                        <Badge variant="destructive" className="h-5 animate-pulse px-2 py-0 text-xs font-bold uppercase">
                                                            Overdue
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2 p-3 pt-0 2xl:p-4 2xl:pt-0">
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant={getStatusVariant(task.status)} className="px-2 py-0 text-xs font-medium 2xl:text-sm">
                                                        {task.status}
                                                    </Badge>
                                                    <Badge variant={getPriorityVariant(task.priority)} className="px-2 py-0 text-xs font-medium 2xl:text-sm">
                                                        {task.priority}
                                                    </Badge>
                                                    <span className="ml-auto flex items-center text-xs text-muted-foreground 2xl:text-sm">
                                                        {isExpanded ? 'Collapse' : 'Expand'}
                                                    </span>
                                                </div>

                                                <p className={cn(
                                                    "text-xs text-muted-foreground transition-all",
                                                    isExpanded ? "line-clamp-none" : "line-clamp-1"
                                                )}>
                                                    {task.description}
                                                </p>

                                                <div className={cn(
                                                    "grid gap-2 overflow-hidden transition-all duration-300 ease-out",
                                                    isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                                )}>
                                                    <div className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs font-semibold text-muted-foreground 2xl:text-sm">
                                                        <span>Created: {age}</span>
                                                    </div>
                                                    {task.due_at && (
                                                        <div className={cn(
                                                            "flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs font-semibold 2xl:text-sm",
                                                            overdue ? "text-destructive" : "text-muted-foreground"
                                                        )}>
                                                            <span>
                                                                Due (Manila): {formatInManila(task.due_at, {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: '2-digit',
                                                                    hour12: true,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                            </CardContent>
                                        </Card>
                                    );
                                })}
                                {employee.tasks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center opacity-40">
                                        <p className="text-sm italic 2xl:text-base">No tasks</p>
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
                @keyframes task-slide-in {
                    0% {
                        opacity: 0;
                        transform: translateX(44px) scale(0.98);
                    }
                    60% {
                        opacity: 1;
                        transform: translateX(-4px) scale(1.01);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                .animate-task-slide-in {
                    animation: task-slide-in 0.75s cubic-bezier(0.22, 1, 0.36, 1);
                }
                @keyframes task-flip {
                    0% {
                        transform: perspective(1200px) rotateX(0deg);
                    }
                    50% {
                        transform: perspective(1200px) rotateX(90deg);
                    }
                    100% {
                        transform: perspective(1200px) rotateX(0deg);
                    }
                }
                .animate-task-flip {
                    animation: task-flip 0.75s cubic-bezier(0.19, 1, 0.22, 1);
                    transform-origin: center;
                    backface-visibility: hidden;
                    will-change: transform;
                }
            `}} />

            {soundsReady && !soundsUnlocked && (
                <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
                    {soundStatusMessage && (
                        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground shadow-md">
                            {soundStatusMessage}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            void tryUnlockSounds();
                        }}
                        className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold shadow-md"
                    >
                        Enable Sound
                    </button>
                </div>
            )}

            {soundsReady && soundsUnlocked && (
                <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            playStatusSound('ASSIGNED');
                            setSoundStatusMessage('Played test sound.');
                        }}
                        className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold shadow-md"
                    >
                        Test Sound
                    </button>
                    {soundStatusMessage && (
                        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground shadow-md">
                            {soundStatusMessage}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
