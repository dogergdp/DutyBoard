import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useInitials } from '@/hooks/use-initials';
import type { Employee } from '../types';

interface LeaderboardItem {
    id: number;
    full_name: string;
    photo_path: string | null;
    done_count: number;
}

interface LeaderboardProps {
    data: LeaderboardItem[];
}

export default function Leaderboard({ data }: LeaderboardProps) {
    const getInitials = useInitials();

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-muted/30 p-5 2xl:p-6" style={{ minWidth: '25%', maxWidth: '25%' }}>
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3 2xl:mb-6">
                <h3 className="text-lg leading-tight font-semibold 2xl:text-xl">Leaderboard</h3>
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {data.length > 0 ? (
                    data.map((employee, index) => (
                        <div key={employee.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3 hover:bg-background/60 transition-colors flex-shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm bg-primary/20 text-primary shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-10 w-10 border border-primary/10 shrink-0">
                                        <AvatarImage src={employee.photo_path || ''} alt={employee.full_name} />
                                        <AvatarFallback className="bg-primary/5 text-xs text-primary">
                                            {getInitials(employee.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium truncate">{employee.full_name}</span>
                                </div>
                            </div>
                            <Badge variant="secondary" className="ml-2 shrink-0">
                                {employee.done_count}
                            </Badge>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-8 text-center opacity-40">
                        <p className="text-xs italic">No completed tasks</p>
                    </div>
                )}
            </div>
        </div>
    );
}
