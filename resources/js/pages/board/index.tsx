import { Head } from '@inertiajs/react';

import { useBoardSounds } from '@/hooks/use-board-sounds';
import { useBoardSocket } from '@/hooks/use-board-socket';
import BoardHeader from './components/BoardHeader';
import EmployeeColumn from './components/EmployeeColumn';
import Leaderboard from './components/Leaderboard';
import BoardLoadingState from './components/BoardLoadingState';
import BoardStyles from './components/BoardStyles';
import { useBoardState } from './hooks/use-board-state';
import { useRandomJoke } from './hooks/use-random-joke';
import { useLeaderboardData } from './hooks/use-leaderboard-data';
import { SOUND_STATUSES } from './constants';

import type { BoardProps } from './types';

export default function Board({ employees }: BoardProps) {
    const randomJoke = useRandomJoke();
    const { expandedTaskIds, manilaNow, setManilaNow, toggleTaskExpanded } = useBoardState();

    const {
        soundsReady,
        soundsUnlocked,
        soundStatusMessage,
        readySoundCount,
        tryUnlockSounds,
        playStatusSound,
    } = useBoardSounds();

    const {
        liveEmployees,
        animatedEmployeeId,
        animatedTaskIds,
        flippedTaskIds,
        disappearingTaskIds,
    } = useBoardSocket(employees, playStatusSound);

    const leaderboardData = useLeaderboardData(liveEmployees);

    const handleTimeChange = (newTime: Date) => {
        setManilaNow(newTime);
    };

    if (!soundsReady) {
        return <BoardLoadingState readySoundCount={readySoundCount} totalSounds={SOUND_STATUSES.length} />;
    }

    return (
        <>
            <Head title="Task Board" />
            <div className="flex h-screen flex-col overflow-hidden p-8 lg:p-10 2xl:p-14">
                <BoardHeader
                    randomJoke={randomJoke}
                    manilaNow={manilaNow}
                    onTimeChange={handleTimeChange}
                    soundsReady={soundsReady}
                    soundsUnlocked={soundsUnlocked}
                    soundStatusMessage={soundStatusMessage}
                    readySoundCount={readySoundCount}
                    tryUnlockSounds={tryUnlockSounds}
                    playStatusSound={playStatusSound}
                />

                <div className="flex flex-1 gap-6 overflow-hidden 2xl:gap-8 h-full min-h-0">
                    <div className="flex flex-1 flex-col gap-6 overflow-hidden h-full min-h-0">
                        <div className="flex flex-1 gap-8 overflow-x-auto board-scroller pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 2xl:gap-10 h-full">
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
                                    currentTime={manilaNow}
                                />
                            ))}
                        </div>
                    </div>

                    <Leaderboard data={leaderboardData} />
                </div>
                
                <BoardStyles />
            </div>
        </>
    );
}