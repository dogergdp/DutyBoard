const BOARD_STYLES = `
    @keyframes pulse-light {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.95; transform: scale(1.005); box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
    }
    .animate-pulse-light {
        animation: pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes task-slide-in {
        0% {
            opacity: 0;
            transform: translateX(44px) scale(0.98);
        }
        60% {
            opacity: 1;
            transform: translateX(-4px) scale(1.01);
        }
        100% {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
    }
    .animate-task-slide-in {
        animation: task-slide-in 0.75s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes task-flip {
        0% {
            transform: perspective(1200px) rotateX(0deg);
        }
        50% {
            transform: perspective(1200px) rotateX(90deg);
        }
        100% {
            transform: perspective(1200px) rotateX(0deg);
        }
    }
    .animate-task-flip {
        animation: task-flip 0.75s cubic-bezier(0.19, 1, 0.22, 1);
        transform-origin: center;
        backface-visibility: hidden;
        will-change: transform;
    }
    @keyframes task-disappear {
        0% {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
        50% {
            opacity: 1;
            transform: scale(1.05) translateY(-10px);
        }
        100% {
            opacity: 0;
            transform: scale(0.8) translateY(-60px);
        }
    }
    .animate-task-disappear {
        animation: task-disappear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes column-slide {
        0% { transform: translateX(100%); opacity: 0; }
        60% { transform: translateX(-20%) scale(1.02); opacity: 1; }
        100% { transform: translateX(0); opacity: 1; }
    }
    .animate-column-slide {
        animation: column-slide 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes task-expand-bounce {
        0% { transform: scaleY(0.995); }
        60% { transform: scaleY(1.03); }
        100% { transform: scaleY(1); }
    }

    .animate-task-expand {
        animation: task-expand-bounce 520ms cubic-bezier(0.22, 1, 0.36, 1);
        transform-origin: top center;
        will-change: transform;
    }

    /* Smoothly animate changes to max-height for expanding/collapsing cards */
    .transition-max-h {
        transition: max-height 420ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    /* Hide scrollbars for the board scroller while preserving scroll behavior */
    .board-scroller {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
    }

    .board-scroller::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
        height: 0;
    }
`;

export default function BoardStyles() {
    return <style dangerouslySetInnerHTML={{ __html: BOARD_STYLES }} />;
}
