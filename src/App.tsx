import { useState } from 'react';
import { Dumbbell, List, BarChart2 } from 'lucide-react';
import { WorkoutSession } from './features/workout/components/WorkoutSession';
import { History } from './features/history/components/History';
import { Analytics } from './features/analytics/components/Analytics';

type Tab = 'workout' | 'history' | 'analytics';

function TabButton({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 flex-1 py-3 transition-colors ${
        active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300'
      }`}
    >
      <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workout');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'workout' && <WorkoutSession />}
        {activeTab === 'history' && <History />}
        {activeTab === 'analytics' && <Analytics />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
        <div className="flex max-w-md mx-auto">
          <TabButton
            icon={Dumbbell}
            label="Workout"
            active={activeTab === 'workout'}
            onClick={() => setActiveTab('workout')}
          />
          <TabButton
            icon={List}
            label="History"
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
          <TabButton
            icon={BarChart2}
            label="Progress"
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
        </div>
      </nav>
    </div>
  );
}

export default App;