import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

interface ProfilePopup {
    id: number;
    full_name: string;
    photo_path: string | null;
    key: string;
    task_title: string;
    ribbon_text: string;
}

interface CompletionPopupProps {
    popups: ProfilePopup[];
}

export default function CompletionPopup({ popups }: CompletionPopupProps) {
    const getInitials = useInitials();

    if (popups.length === 0) {
        return null;
    }

    return (
        <>
            {popups.map((popup) => (
                <div
                    key={popup.key}
                    className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
                >
                    <div className="animate-profile-popup flex flex-col items-center justify-center relative">
                        <Avatar className="h-96 w-96 border-8 border-primary shadow-2xl 2xl:h-[500px] 2xl:w-[500px] 2xl:border-16 z-10 bg-white">
                            <AvatarImage src={popup.photo_path || ''} alt={popup.full_name} />
                            <AvatarFallback className="bg-primary/10 text-8xl font-bold text-primary 2xl:text-9xl">
                                {getInitials(popup.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="absolute top-[75%] z-20 transform -rotate-3">
                            <div className="bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-amber-950 font-black text-5xl 2xl:text-7xl px-8 py-3 rounded-2xl border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.4)] tracking-wider uppercase">
                                {popup.ribbon_text}
                            </div>
                        </div>

                        <div className="bg-black/85 backdrop-blur-md rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] mt-8 border-2 border-white/10 transform min-w-[400px] max-w-2xl px-12 z-30">
                            <h2 className="text-4xl 2xl:text-5xl font-extrabold text-white mb-2">{popup.full_name}</h2>
                            <p className="text-lg 2xl:text-xl font-bold text-emerald-400 tracking-widest uppercase mb-1">Completed Task</p>
                            <p className="text-2xl 2xl:text-3xl text-white/90 font-medium line-clamp-2">{popup.task_title}</p>
                        </div>
                    </div>
                </div>
            ))}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes profile-popup {
                    0% {
                        opacity: 0;
                        transform: translateY(80px) scale(0.92);
                    }
                    18% {
                        opacity: 1;
                        transform: translateY(-8px) scale(1.03);
                    }
                    28% {
                        transform: translateY(0) scale(1);
                    }
                    80% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-24px) scale(0.96);
                    }
                }
                .animate-profile-popup {
                    animation: profile-popup 3.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
            `}} />
        </>
    );
}
