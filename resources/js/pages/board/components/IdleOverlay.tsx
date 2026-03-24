import { useEffect, useState } from 'react';

const MESSAGES = [
    "Hydrate check 💧",
    "Stretch break 🧘",
    "Blink your eyes 👀",
    "Posture check 🦒",
    "Take a deep breath 🌬️"
];

export default function IdleOverlay({ isIdle }: { isIdle: boolean }) {
    const [message, setMessage] = useState(MESSAGES[0]);

    useEffect(() => {
        if (isIdle) {
            setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
        }
    }, [isIdle]);

    if (!isIdle) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-lg transition-all duration-1000 animate-in fade-in duration-500">
            <h1 className="text-6xl md:text-8xl 2xl:text-9xl font-black text-white opacity-90 tracking-tighter animate-pulse text-center px-8">
                {message}
            </h1>
            <p className="fixed bottom-12 left-0 right-0 text-center text-white/30 text-sm tracking-widest uppercase font-semibold">
                Idle Mode Active • Waiting for activity
            </p>
        </div>
    );
}
