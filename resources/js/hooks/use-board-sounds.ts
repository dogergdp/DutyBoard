import { useEffect, useMemo, useRef, useState } from 'react';

const SOUND_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;

export const useBoardSounds = () => {
    const [soundsReady, setSoundsReady] = useState(false);
    const [soundsUnlocked, setSoundsUnlocked] = useState(false);
    const [soundStatusMessage, setSoundStatusMessage] = useState('');
    const [readySoundCount, setReadySoundCount] = useState(0);
    const soundPlayersRef = useRef<Partial<Record<(typeof SOUND_STATUSES)[number], HTMLAudioElement>>>({});
    const lastSoundTimeRef = useRef<number>(0);

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

    const playStatusSound = (status: string) => {
        if (!soundsUnlocked) {
            return;
        }

        const now = Date.now();
        if (now - lastSoundTimeRef.current < 1000) {
            return;
        }
        lastSoundTimeRef.current = now;

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

    // Load audio files
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

                audio.addEventListener('canplaythrough', onReady, { once: true });
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

    // Auto-unlock sounds on first user interaction
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

        window.addEventListener('pointerdown', unlockOnInteraction, { once: true });
        window.addEventListener('keydown', unlockOnInteraction, { once: true });

        return () => {
            window.removeEventListener('pointerdown', unlockOnInteraction);
            window.removeEventListener('keydown', unlockOnInteraction);
        };
    }, [soundsReady, soundsUnlocked]);

    return {
        soundsReady,
        soundsUnlocked,
        soundStatusMessage,
        readySoundCount,
        tryUnlockSounds,
        playStatusSound,
    };
};
