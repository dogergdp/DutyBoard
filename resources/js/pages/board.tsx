import { Head } from '@inertiajs/react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

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
    console.log('[Board] Component mounted');
    const SOUND_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;

    const JOKES = [
        "Why do developers go broke? Because they use up all their cache!",
        "Why did the developer go broke? He used up all his cache!",
        "How many programmers does it take to change a lightbulb? None, that's a hardware problem!",
        "Why do Java developers wear glasses? Because they can't C#!",
        "Why did the programmer quit his job? He didn't get arrays!",
        "How many developers does it take to change a lightbulb? None, they just tell everyone it's a feature!",
        "Why do programmers prefer dark mode? Because light attracts bugs!",
        "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'",
        "Why did the developer go to the bank? To get his balance!",
        "Why is a programmer like a firefighter? They both fight bugs!",
        "Why did the programmer bring two monitors to the meeting? He wanted to see the big picture!",
        "What did the IT guy say when asked to fix the WiFi? Have you tried turning it off and on again?",
        "Why do programmers always mix up Halloween and Christmas? Because Oct 31 equals Dec 25!",
        "A manager asks a programmer, 'How long will it take to finish?' Programmer replies, '2 weeks'. Manager says, 'That's what you said 2 weeks ago!' Programmer: 'Yes, and I was right!'",
        "Why do programmers make terrible partners? They only commit when forced!",
    ];

    const randomJoke = useMemo(() => {
        return JOKES[Math.floor(Math.random() * JOKES.length)];
    }, []);

    const getInitials = useInitials();
    const [liveEmployees, setLiveEmployees] = useState<Employee[]>(employees);
    const [animatedTaskIds, setAnimatedTaskIds] = useState<number[]>([]);
    const [flippedTaskIds, setFlippedTaskIds] = useState<number[]>([]);
    const [expandedTaskIds, setExpandedTaskIds] = useState<number[]>([]);
    const [disappearingTaskIds, setDisappearingTaskIds] = useState<number[]>([]);
    const [animatedEmployeeId, setAnimatedEmployeeId] = useState<number | null>(null);
    const [soundsReady, setSoundsReady] = useState(false);
    const [soundsUnlocked, setSoundsUnlocked] = useState(false);
    const [soundStatusMessage, setSoundStatusMessage] = useState('');
    const [readySoundCount, setReadySoundCount] = useState(0);
    const [manilaNow, setManilaNow] = useState(() => new Date());
    const previousTasksRef = useRef<TaskSnapshot>({});
    const hasReceivedFirstUpdateRef = useRef(false);
    const soundPlayersRef = useRef<Partial<Record<(typeof SOUND_STATUSES)[number], HTMLAudioElement>>>({});
    const lastSoundTimeRef = useRef<number>(0);

    const socketUrl = useMemo(
        () => import.meta.env.VITE_SOCKET_URL ?? 'http://127.0.0.1:4001',
        [],
    );

    const soundUrls = useMemo(
        () => {
            const cachebust = new Date().toISOString().split('T')[0];
            return {
                ASSIGNED: `/sounds/assigned.wav?v=${cachebust}`,
                IN_PROGRESS: `/sounds/in-progress.wav?v=${cachebust}`,
                REVIEW: `/sounds/review.wav?v=${cachebust}`,
                DONE: `/sounds/done.wav?v=${cachebust}`,
            };
        },
        [],
    );

    const fallbackSoundUrls = useMemo(
        () => {
            const cachebust = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            return {
                ASSIGNED: `/sounds/assigned.wav?v=${cachebust}`,
                IN_PROGRESS: `/sounds/in-progress.wav?v=${cachebust}`,
                REVIEW: `/sounds/review.wav?v=${cachebust}`,
                DONE: `/sounds/done.wav?v=${cachebust}`,
            };
        },
        [],
    );

    const playStatusSound = (status: string) => {
        if (!soundsUnlocked) {
            return;
        }

        const now = Date.now();
        if (now - lastSoundTimeRef.current < 1000) {
            return; // ignore if played within last second
        }
        lastSoundTimeRef.current = now;

        const soundKey = status as (typeof SOUND_STATUSES)[number];
        const player = soundPlayersRef.current[soundKey];

        console.log(`[Sound] Playing ${soundKey}:`, player?.src);

        if (!player) {
            console.warn(`[Sound] No player for ${soundKey}`);
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
                        console.log(`[Sound] Loaded ${status}: ${candidate}`);
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
            console.log('[Sound] All sounds loaded:', loadedPlayers);
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

        // sort initial employees by latest task update
        const withRecent = employees.map(emp => {
            const last = emp.tasks.reduce((max, t) => {
                const ts = new Date(t.updated_at).getTime();
                return ts > max ? ts : max;
            }, 0);
            return { ...emp, lastUpdate: last };
        });
        withRecent.sort((a, b) => b.lastUpdate - a.lastUpdate);
        setLiveEmployees(withRecent.map(e => ({
            id: e.id,
            full_name: e.full_name,
            photo_path: e.photo_path,
            tasks: e.tasks,
        })));
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

            // determine latest update time for each employee
            const withRecent = nextEmployees.map(emp => {
                const last = emp.tasks.reduce((max, t) => {
                    const ts = new Date(t.updated_at).getTime();
                    return ts > max ? ts : max;
                }, 0);
                return { ...emp, lastUpdate: last };
            });

            withRecent.sort((a, b) => b.lastUpdate - a.lastUpdate);

            nextEmployees = withRecent.map(e => ({ id: e.id, full_name: e.full_name, photo_path: e.photo_path, tasks: e.tasks }));

            previousTasksRef.current = nextSnapshot;

            // animate if front employee changed
            if (liveEmployees[0]?.id !== nextEmployees[0]?.id) {
                setAnimatedEmployeeId(nextEmployees[0]?.id ?? null);
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

            // Trigger confetti and disappearing animation for completed tasks
            if (tasksBecomingDone.length > 0) {
                // Trigger confetti animation
                void confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    gravity: 0.8,
                    ticks: 400,
                });

                // Mark tasks for disappearing animation
                setDisappearingTaskIds((current) =>
                    Array.from(new Set([...current, ...tasksBecomingDone])),
                );

                // Remove tasks after animation completes
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
    }, [socketUrl, soundsUnlocked]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'DONE': return 'default';
            case 'IN_PROGRESS': return 'secondary';
            case 'REVIEW': return 'outline';
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

    const leaderboardData = useMemo(() => {
        return liveEmployees
            .map((employee) => ({
                id: employee.id,
                full_name: employee.full_name,
                photo_path: employee.photo_path,
                done_count: employee.tasks.filter(task => task.status === 'DONE').length,
            }))
            .sort((a, b) => b.done_count - a.done_count);
    }, [liveEmployees]);

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
            <div className="flex h-screen flex-col overflow-hidden p-8 lg:p-10 2xl:p-14">
                <div className="mb-8 flex flex-col gap-4 2xl:mb-10">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex-shrink-0">
                            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl 2xl:text-6xl">DutyBoard</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {soundsReady && !soundsUnlocked && (
                                <button
                                    type="button"
                                    onClick={() => void tryUnlockSounds()}
                                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold shadow-md"
                                >
                                    Enable Sound
                                </button>
                            )}
                            {soundsReady && soundsUnlocked && (
                                <>
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
                                </>
                            )}
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
                    <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                        <p className="text-center text-sm italic text-muted-foreground 2xl:text-base">{randomJoke}</p>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden 2xl:gap-8 h-full min-h-0">
                    <div className="flex flex-1 flex-col gap-6 overflow-hidden h-full min-h-0">
                        <div className="flex flex-1 gap-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 2xl:gap-10 h-full">
                    {liveEmployees.map((employee) => (
                        <div
                            key={employee.id}
                            className={cn(
                                "flex h-full min-w-[420px] max-w-[420px] flex-col rounded-xl border border-border bg-muted/30 p-5 2xl:min-w-[520px] 2xl:max-w-[520px] 2xl:p-6",
                                animatedEmployeeId === employee.id ? "animate-column-slide" : ""
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
                                        <span className="text-lg leading-tight font-semibold 2xl:text-xl">{employee.full_name}</span>
                                        <span className="text-sm text-muted-foreground 2xl:text-base">{employee.tasks.filter(t => t.status !== 'DONE').length} {employee.tasks.filter(t => t.status !== 'DONE').length === 1 ? 'task' : 'tasks'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
                                {employee.tasks
                                    .filter(task => task.status !== 'DONE' || disappearingTaskIds.includes(task.id))
                                    .map((task) => {
                                    const overdue = task.due_at && isPast(new Date(task.due_at)) && task.status !== 'DONE';
                                    const age = formatDistanceToNow(new Date(task.created_at), { addSuffix: true });
                                    const isExpanded = expandedTaskIds.includes(task.id);

                                    return (
                                        <Card
                                            key={task.id}

                                            className={cn(
                                            "shadow-sm hover:shadow-md transition-all border-l-4",
                                            animatedTaskIds.includes(task.id)
                                                ? "animate-task-slide-in"
                                                : "",
                                            flippedTaskIds.includes(task.id)
                                                ? "animate-task-flip"
                                                : "",
                                            disappearingTaskIds.includes(task.id)
                                                ? "animate-task-disappear"
                                                : "",
                                            overdue ? "border-l-destructive ring-1 ring-destructive/20 animate-pulse-light shadow-destructive/10" : "border-l-primary/30"
                                        )}
                                        >
                                            <CardHeader className="p-3 pb-2 2xl:p-4 2xl:pb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <CardTitle className="text-sm leading-tight font-bold 2xl:text-base">
                                                            {task.title}
                                                        </CardTitle>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            <Badge variant={getStatusVariant(task.status)} className="px-2 py-0 text-xs font-medium 2xl:text-sm">
                                                                {task.status}
                                                            </Badge>
                                                            <Badge variant={getPriorityVariant(task.priority)} className="px-2 py-0 text-xs font-medium 2xl:text-sm">
                                                                {task.priority}
                                                            </Badge>
                                                            {overdue && (
                                                                <Badge variant="destructive" className="px-2 py-0 text-xs font-bold uppercase">
                                                                    Overdue
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleTaskExpanded(task.id);
                                                        }}
                                                        className="flex-shrink-0 p-1 rounded hover:bg-muted/20"
                                                    >
                                                        <ChevronDown
                                                            className={cn(
                                                                "w-4 h-4 transition-transform",
                                                                isExpanded && "rotate-180"
                                                            )}
                                                        />
                                                    </button>
                                                </div>
                                            </CardHeader>
                                            {isExpanded && (
                                                <CardContent className="space-y-2 p-3 pt-0 2xl:p-4 2xl:pt-0">
                                                    <p className="text-xs text-muted-foreground">
                                                        {task.description}
                                                    </p>
                                                    <div className="grid gap-2">
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
                                            )}
                                        </Card>
                                    );
                                })}
                                {employee.tasks.filter(t => t.status !== 'DONE' || disappearingTaskIds.includes(t.id)).length === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center opacity-40">
                                        <p className="text-sm italic 2xl:text-base">No tasks</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                        </div>
                    </div>

                    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-muted/30 p-5 2xl:p-6" style={{ minWidth: '25%', maxWidth: '25%' }}>
                        <div className="mb-5 flex items-center justify-between border-b border-border pb-3 2xl:mb-6">
                            <h3 className="text-lg leading-tight font-semibold 2xl:text-xl">Leaderboard</h3>
                        </div>
                        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                            {leaderboardData.length > 0 ? (
                                leaderboardData.map((employee, index) => (
                                    <div key={employee.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3 hover:bg-background/60 transition-colors flex-shrink-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm bg-primary/20 text-primary shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar className="h-10 w-10 border border-primary/10 shrink-0">
                                                    <AvatarImage src={employee.photo_path || ''} alt={employee.full_name} />
                                                    <AvatarFallback className="bg-primary/5 text-xs text-primary">
                                                        {getInitials(employee.full_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium truncate">{employee.full_name}</span>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="ml-2 shrink-0">
                                            {employee.done_count}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-8 text-center opacity-40">
                                    <p className="text-xs italic">No completed tasks</p>
                                </div>
                            )}
                        </div>
                    </div>
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
                @keyframes task-disappear {
                    0% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.05) translateY(-10px);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0.8) translateY(-60px);
                    }
                }
                .animate-task-disappear {
                    animation: task-disappear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes column-slide {
                    0% { transform: translateX(100%); opacity: 0; }
                    60% { transform: translateX(-20%) scale(1.02); opacity: 1; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                .animate-column-slide {
                    animation: column-slide 0.8s cubic-bezier(0.22, 1, 0.36, 1);
                }
            `}} />


        </>
    );
}
