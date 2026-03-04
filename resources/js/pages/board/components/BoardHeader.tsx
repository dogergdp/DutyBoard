import { format } from 'date-fns';
import React from 'react';

interface BoardHeaderProps {
    randomJoke: string;
    manilaNow: Date;
    soundsReady: boolean;
    soundsUnlocked: boolean;
    soundStatusMessage: string;
    readySoundCount: number;
    tryUnlockSounds: () => Promise<boolean>;
    playStatusSound: (status: string) => void;
}

export default function BoardHeader({
    randomJoke,
    manilaNow,
    soundsReady,
    soundsUnlocked,
    soundStatusMessage,
    readySoundCount,
    tryUnlockSounds,
    playStatusSound,
}: BoardHeaderProps) {
    return (
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
                                    // if desired, parent can display message
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
                        {format(manilaNow, {
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
    );
}
