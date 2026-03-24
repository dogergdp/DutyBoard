import { formatInManila } from '../utils';
import React, { useState, useEffect } from 'react';

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
    tryUnlockSounds,
}: BoardHeaderProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err: Error) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            void tryUnlockSounds();
        } else {
            if (document.exitFullscreen) {
                void document.exitFullscreen();
            }
        }
    };

    return (
        <>
            <div className="mb-8 flex flex-col gap-4 2xl:mb-10">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex-shrink-0">
                        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl 2xl:text-6xl">DutyBoard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                            className="rounded-xl border border-border bg-background p-4 shadow-md hover:bg-accent transition-colors"
                        >
                            {isFullscreen ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="36"
                                    height="36"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="36"
                                    height="36"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-semibold 2xl:text-base text-foreground">
                            {formatInManila(manilaNow, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true,
                            })}
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                    <p className="text-center text-sm italic text-muted-foreground 2xl:text-base">{randomJoke}</p>
                </div>
            </div>
        </>
    );
}
