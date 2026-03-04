// A tiny helper module for the board page.  It does *not* depend on
// React and therefore lives in an "api" folder alongside other
// service modules.  Right now the only thing we expose is the mapping
// between status values and sound URLs, which the client can either
// obtain from environment variables or via an API endpoint.

export type SoundKey = 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE';

export interface SoundUrls {
  ASSIGNED: string;
  IN_PROGRESS: string;
  REVIEW: string;
  BLOCKED: string;
  DONE: string;
}

/**
 * Read default URLs from Vite environment variables (with sensible
 * fallbacks).
 */
export function getDefaultSoundUrls(): SoundUrls {
  return {
    ASSIGNED: import.meta.env.VITE_SOUND_ASSIGNED ?? '/sounds/assigned.mp3',
    IN_PROGRESS: import.meta.env.VITE_SOUND_IN_PROGRESS ?? '/sounds/in-progress.mp3',
    REVIEW: import.meta.env.VITE_SOUND_REVIEW ?? '/sounds/review.mp3',
    BLOCKED: import.meta.env.VITE_SOUND_BLOCKED ?? '/sounds/blocked.mp3',
    DONE: import.meta.env.VITE_SOUND_DONE ?? '/sounds/done.mp3',
  };
}




/**
 * Placeholder demonstrating how the configuration might be fetched from
 * the server.  If you don’t currently have an `/api/sounds` route you
 * can leave this unused, but the shape is preserved for future
 * expansion.
 */
export async function fetchSoundUrls(): Promise<SoundUrls> {
  const resp = await fetch('/api/sounds');
  if (!resp.ok) {
    throw new Error('unable to load sound configuration');
  }
  return (await resp.json()) as SoundUrls;
}
