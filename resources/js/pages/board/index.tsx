import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { useBoardSounds } from '@/hooks/use-board-sounds';
import { useBoardSocket } from '@/hooks/use-board-socket';
import BoardHeader from './components/BoardHeader';
import EmployeeColumn from './components/EmployeeColumn';
import Leaderboard from './components/Leaderboard';

import type { BoardProps, Employee } from './types';


export default function Board({ employees }: BoardProps) {
    // constant definitions used throughout the page
    const SOUND_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE'] as const;

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

    const [expandedTaskIds, setExpandedTaskIds] = useState<number[]>([]);
    const [manilaNow, setManilaNow] = useState(() => new Date());

    // pull in sounds behaviour from custom hook
    const {
        soundsReady,
        soundsUnlocked,
        soundStatusMessage,
        readySoundCount,
        tryUnlockSounds,
        playStatusSound,
    } = useBoardSounds();

    // socket hook provides live employees and all animation arrays
    const {
        liveEmployees,
        animatedEmployeeId,
        animatedTaskIds,
        flippedTaskIds,
        disappearingTaskIds,
    } = useBoardSocket(employees, playStatusSound);


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
        const interval = window.setInterval(() => {
            setManilaNow(new Date());
        }, 60_000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);



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
                <BoardHeader
                randomJoke={randomJoke}
                manilaNow={manilaNow}
                soundsReady={soundsReady}
                soundsUnlocked={soundsUnlocked}
                soundStatusMessage={soundStatusMessage}
                readySoundCount={readySoundCount}
                tryUnlockSounds={tryUnlockSounds}
                playStatusSound={playStatusSound}
            />

                <div className="flex flex-1 gap-6 overflow-hidden 2xl:gap-8 h-full min-h-0">
                    <div className="flex flex-1 flex-col gap-6 overflow-hidden h-full min-h-0">
                        <div className="flex flex-1 gap-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 2xl:gap-10 h-full">
                            {liveEmployees.map((employee) => (
                                <EmployeeColumn
                                    key={employee.id}
                                    employee={employee}
                                    animatedEmployeeId={animatedEmployeeId}
                                    animatedTaskIds={animatedTaskIds}
                                    flippedTaskIds={flippedTaskIds}
                                    disappearingTaskIds={disappearingTaskIds}
                                    expandedTaskIds={expandedTaskIds}
                                    toggleTaskExpanded={toggleTaskExpanded}
                                />
                            ))}
                        </div>
                    </div>

                    <Leaderboard data={leaderboardData} />
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