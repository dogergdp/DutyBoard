import { useMemo } from 'react';
import { JOKES } from '../constants';

export const useRandomJoke = () => {
    return useMemo(() => {
        const storageKey = 'dutyboard:randomJoke';

        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const stored = sessionStorage.getItem(storageKey);
                if (stored) return stored;

                const selected = JOKES[Math.floor(Math.random() * JOKES.length)];
                sessionStorage.setItem(storageKey, selected);
                return selected;
            }
        } catch {
            // ignore storage errors
        }

        return JOKES[Math.floor(Math.random() * JOKES.length)];
    }, []);
};
