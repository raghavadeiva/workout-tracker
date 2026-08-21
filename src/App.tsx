import { useEffect } from 'react';
import { useState } from 'react';
import { MaterialIcon } from './components/MaterialIcon';
import { RestTimerProvider } from './hooks/useRestTimer';
import { RestTimerBanner } from './features/workout/components/RestTimerBanner';
import { WorkoutSession } from './features/workout/components/WorkoutSession';
import { HistoryScreen } from './features/history/components/History';
import { Analytics } from './features/analytics/components/Analytics';

type Tab = 'workout' | 'history' | 'progress';

const TAB_HEIGHT = 64; // pill bar height incl. padding
const TABS: {
  id: Tab;
  label: string;
  icon: string;
  fillActive: number;
}[] = [
  { id: 'workout', label: 'Workout', icon: 'fitness_center', fillActive: 1 },
  { id: 'history', label: 'History', icon: 'history', fillActive: 1 },
  { id: 'progress', label: 'Progress', icon: 'show_chart', fillActive: 1 },
];

/**
 * Each tab owns a permanent absolutely-positioned scroll pane.
 * Inactive panes are display:none — zero remounts, per-tab scroll
 * preserved, tab-switch bounce impossible by construction.
 */
function Pane({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 overflow-y-auto overscroll-contain"
      style={{
        display: active ? undefined : 'none',
        paddingBottom: `calc(${TAB_HEIGHT + 20}px + env(safe-area-inset-bottom))`,
      }}
    >
      {children}
    </div>
  );
}

/** Ask once for Notification permission on first meaningful interaction. */
function useNotificationPermission() {
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;

    const ask = () => {
      void Notification.requestPermission();
      window.removeEventListener('pointerdown', ask);
      window.removeEventListener('keydown', ask);
    };
    window.addEventListener('pointerdown', ask, { once: true });
    window.addEventListener('keydown', ask, { once: true });
    return () => {
      window.removeEventListener('pointerdown', ask);
      window.removeEventListener('keydown', ask);
    };
  }, []);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workout');
  useNotificationPermission();

  return (
    <RestTimerProvider>
      <div className="flex flex-col h-dvh bg-app">
        {/* Positioned host — panes anchor to this */}
        <div className="relative flex-1 min-h-0">
          <Pane active={activeTab === 'workout'}>
            <WorkoutSession />
          </Pane>
          <Pane active={activeTab === 'history'}>
            <HistoryScreen />
          </Pane>
          <Pane active={activeTab === 'progress'}>
            <Analytics />
          </Pane>
        </div>

        {/* Rest timer — app-level so it survives tab switches */}
        <RestTimerBanner />

        {/* Floating pill tab bar — blue filled circle marks the active tab */}
        <nav
          className="fixed left-1/2 -translate-x-1/2 z-30 material rounded-full flex items-center justify-around px-3"
          style={{
            bottom: `calc(16px + env(safe-area-inset-bottom))`,
            height: TAB_HEIGHT,
            width: 'min(400px, calc(100% - 40px))',
            border: '0.5px solid rgba(209, 209, 214, 0.6)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
          aria-label="Main navigation"
        >
          {TABS.map(({ id, label, icon, fillActive }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className="pressable rounded-full bg-transparent border-none cursor-pointer p-2"
              >
                {active ? (
                  <span
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-blue)' }}
                  >
                    <MaterialIcon name={icon} size={24} fill={fillActive} />
                    <span className="sr-only">{label}</span>
                  </span>
                ) : (
                  <span className="w-[52px] h-[52px] rounded-full flex items-center justify-center">
                    <MaterialIcon
                      name={icon}
                      size={26}
                      style={{ color: 'var(--color-secondary)' }}
                    />
                    <span className="sr-only">{label}</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </RestTimerProvider>
  );
}
