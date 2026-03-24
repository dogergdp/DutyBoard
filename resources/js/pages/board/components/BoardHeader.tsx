import { format } from 'date-fns';
import { formatInManila } from '../utils';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BoardHeaderProps {
    randomJoke: string;
    manilaNow: Date;
    onTimeChange?: (newTime: Date) => void;
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
    onTimeChange,
    soundsReady,
    soundsUnlocked,
    soundStatusMessage,
    readySoundCount,
    tryUnlockSounds,
    playStatusSound,
}: BoardHeaderProps) {
    const [editTimeOpen, setEditTimeOpen] = useState(false);
    const [editTimeValue, setEditTimeValue] = useState(
        format(manilaNow, "yyyy-MM-dd'T'HH:mm")
    );
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

    const handleSaveTime = () => {
        const newDate = new Date(editTimeValue);
        if (!isNaN(newDate.getTime())) {
            onTimeChange?.(newDate);
            setEditTimeOpen(false);
        }
    };

    return (
        <>
            <div className="mb-8 flex flex-col gap-4 2xl:mb-10">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex-shrink-0">
                        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl 2xl:text-6xl">DutyBoard</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold shadow-md"
                        >
                            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                        </button>
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
                        <button
                            type="button"
                            onClick={() => {
                                setEditTimeValue(format(manilaNow, "yyyy-MM-dd'T'HH:mm"));
                                setEditTimeOpen(true);
                            }}
                            className="text-sm font-semibold 2xl:text-base hover:text-primary transition-colors cursor-pointer"
                        >
                            {formatInManila(manilaNow, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </button>
                    </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                    <p className="text-center text-sm italic text-muted-foreground 2xl:text-base">{randomJoke}</p>
                </div>
            </div>

            <Dialog open={editTimeOpen} onOpenChange={setEditTimeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Manila Time</DialogTitle>
                        <DialogDescription>
                            Change the current date and time displayed on the board.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="time-input">Date and Time</Label>
                            <Input
                                id="time-input"
                                type="datetime-local"
                                value={editTimeValue}
                                onChange={(e) => setEditTimeValue(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setEditTimeOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSaveTime}>
                            Save Time
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
