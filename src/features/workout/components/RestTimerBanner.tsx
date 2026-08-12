interface RestTimerBannerProps {
  timeRemaining: number;
  isActive: boolean;
  adjustTime: (seconds: number) => void;
  stopTimer: () => void;
}

export function RestTimerBanner({ timeRemaining, isActive, adjustTime, stopTimer }: RestTimerBannerProps) {
  if (!isActive || timeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return (
    <div className="fixed left-0 right-0 bottom-24 z-50 flex items-center justify-center px-4 pointer-events-none pb-safe">
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2.5 shadow-xl border border-gray-200 dark:border-gray-700 pointer-events-auto max-w-xs w-full">
        <button
          onClick={() => adjustTime(-15)}
          className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition-colors cursor-pointer"
        >
          <span className="-mr-1 font-medium font-mono">−15s</span>
        </button>
        
        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 mx-auto tracking-tight">
          {timeString}
        </div>
        
        <button
          onClick={() => adjustTime(30)}
          className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition-colors cursor-pointer"
        >
          <span className="-mr-1 font-medium font-mono">+30s</span>
        </button>
        
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
        
        <button
          onClick={stopTimer}
          className="p-1.5 text-red-500 hover:text-red-600 active:bg-red-50 dark:active:bg-red-900/30 rounded-full transition-colors cursor-pointer"
          aria-label="Dismiss timer"
        >
          <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
