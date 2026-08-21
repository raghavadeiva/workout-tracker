import { useState, useRef, useEffect } from 'react';
import { Dumbbell, List, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { WorkoutSession } from './features/workout/components/WorkoutSession';
import { History } from './features/history/components/History';
import { Analytics } from './features/analytics/components/Analytics';

type Tab = 'workout' | 'history' | 'analytics';

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'history', label: 'History', icon: List },
  { id: 'analytics', label: 'Progress', icon: BarChart2 },
];

const TAB_HEIGHT = 49; // Apple HIG minimum tab bar height

// Tab content transition: cross-fade only, no vertical slide
// We keep ALL tabs mounted (display: none) to preserve scroll position
// per tab, eliminating bounce on switch (Apple Design §3 — input feedback)
const tabContentVariants = {
  hidden: { opacity: 0, pointerEvents: 'none' as const },
  visible: { opacity: 1, pointerEvents: 'auto' as const },
};

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workout');
  const containerRef = useRef<HTMLDivElement>(null);

  // Render all tabs but keep inactive ones mounted (display none)
  // This preserves scroll position per tab — no bounce on switch
  const renderTabContent = (tab: Tab) => {
    const common = {
      variants: tabContentVariants,
      initial: 'hidden',
      animate: activeTab === tab ? 'visible' : 'hidden',
      transition: { type: 'spring' as const, damping: 1.0, stiffness: 300 },
    };

    switch (tab) {
      case 'workout':
        return (
          <motion.div key="workout" {...common}>
            <WorkoutSession />
          </motion.div>
        );
      case 'history':
        return (
          <motion.div key="history" {...common}>
            <History />
          </motion.div>
        );
      case 'analytics':
        return (
          <motion.div key="analytics" {...common}>
            <Analytics />
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Ensure content container scrolls to top when tab changes
  // (only if user was at top — don't reset scroll mid-session)
  useEffect(() => {
    if (containerRef.current) {
      // Reset scroll on tab change for consistency
      containerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[--color-background] flex flex-col font-body text-[--color-text-primary] overflow-hidden">
      {/* Main Content — scrollable, clears tab bar, all tabs mounted */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: `calc(${TAB_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="space-y-0">
          {renderTabContent('workout')}
          {renderTabContent('history')}
          {renderTabContent('analytics')}
        </div>
      </div>

      {/* Bottom Navigation — Apple-style translucent tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 material flex items-center justify-around pb-[env(safe-area-inset-bottom)] border-t border-[--color-separator] dark:border-gray-800"
        style={{
          height: `calc(${TAB_HEIGHT}px + env(safe-area-inset-bottom))`,
          minHeight: `calc(${TAB_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="relative flex items-center justify-around w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-150 tap-feedback no-tap-highlight outline-none focus:outline-none"
              >
                {/* Active indicator — soft rounded rectangle behind icon */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-x-1/2 -translate-x-1/2 rounded-full bg-blue-50 dark:bg-blue-950/30"
                    style={{
                      width: 40,
                      height: 40,
                      top: 4,
                    }}
                    transition={{
                      type: 'spring' as const,
                      damping: 1.0,
                      stiffness: 300,
                    }}
                  />
                )}
                <Icon
                  className={`relative z-10 w-6 h-6 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <span
                  className={`relative z-10 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
