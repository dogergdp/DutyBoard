import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';

interface BoardLoadingStateProps {
    readySoundCount: number;
    totalSounds: number;
}

export default function BoardLoadingState({
    readySoundCount,
    totalSounds,
}: BoardLoadingStateProps) {
    return (
        <>
            <Head title="Task Board" />
            <div className="flex h-full items-center justify-center p-8">
                <Card className="w-full max-w-xl border-border/60 bg-background/95">
                    <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                        <h2 className="text-2xl font-semibold tracking-tight">Preparing DutyBoard</h2>
                        <p className="text-sm text-muted-foreground">
                            Loading board sounds ({readySoundCount}/{totalSounds})...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
