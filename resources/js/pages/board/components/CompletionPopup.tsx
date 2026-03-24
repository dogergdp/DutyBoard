import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

interface ProfilePopup {
    id: number;
    full_name: string;
    photo_path: string | null;
    key: string;
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
                    className="fixed inset-0 z-50 animate-profile-popup pointer-events-none flex items-center justify-center"
                >
                    <Avatar className="h-96 w-96 border-8 border-primary shadow-2xl 2xl:h-[500px] 2xl:w-[500px] 2xl:border-16">
                        <AvatarImage src={popup.photo_path || ''} alt={popup.full_name} />
                        <AvatarFallback className="bg-primary/10 text-8xl font-bold text-primary 2xl:text-9xl">
                            {getInitials(popup.full_name)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            ))}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes profile-popup {
                    0% {
                        opacity: 0;
                        transform: scale(0.05) rotateZ(-45deg);
                    }
                    30% {
                        opacity: 1;
                        transform: scale(1.2) rotateZ(360deg);
                    }
                    60% {
                        transform: scale(1.1) rotateZ(360deg);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) rotateZ(360deg);
                    }
                }
                .animate-profile-popup {
                    animation: profile-popup 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}} />
        </>
    );
}
