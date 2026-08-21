import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getHistory, type WorkoutSession } from '../../../db/database';
import { getExerciseProgression, getAllExerciseNames } from '../utils/math';
import { detectPlateau, type OneRMDataPoint } from '../plateauDetection';
import { useWeeklyVolume } from '../../volume/useWeeklyVolume';
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  type MuscleGroup,
} from '../../volume/muscleMaps';
import { detectVolumeRisks, type VolumeRiskResult } from '../../volume/volumeUtils';
import { MaterialIcon } from '../../../components/MaterialIcon';

function shortDate(ts: number | string): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 34 };

export function Analytics() {
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getHistory().then((sessions) => {
      if (alive) {
        setHistory(sessions);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const names = useMemo(() => getAllExerciseNames(history), [history]);
  const [selected, setSelected] = useState<string | null>(null);
  const activeName = selected ?? names[0] ?? null;

  useEffect(() => {
    if (selected && !names.includes(selected)) setSelected(null);
  }, [names, selected]);

  const progression = useMemo(
    () => (activeName ? getExerciseProgression(history, activeName) : []),
    [history, activeName]
  );

  const plateaued = useMemo(
    () =>
      detectPlateau(
        progression.map((p): OneRMDataPoint => ({ date: p.date, oneRM: p.oneRM }))
      ),
    [progression]
  );

  const current1rm =
    progression.length > 0 ? progression[progression.length - 1].oneRM : null;
  const best1rm =
    progression.length > 0 ? Math.max(...progression.map((p) => p.oneRM)) : null;
  const delta =
    progression.length >= 2
      ? progression[progression.length - 1].oneRM - progression[0].oneRM
      : null;

  const { weeklyVolume, isLoading: volLoading } = useWeeklyVolume();
  const risks = useMemo(() => detectVolumeRisks(history), [history]);

  if (loading) {
    return (
      <div className="px-5 pt-3">
        <h1 className="display-lg text-ink">Progress</h1>
        <p className="body-md text-tertiary mt-1">Loading…</p>
      </div>
    );
  }

  if (names.length === 0) {
    return (
      <div className="px-5 pt-3">
        <header className="mb-6">
          <h1 className="display-lg text-ink mb-1">Progress</h1>
          <p className="body-md text-tertiary">No data yet</p>
        </header>
        <div className="card p-6 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--color-sunken)' }}
          >
            <MaterialIcon
              name="show_chart"
              size={28}
              style={{ color: 'var(--color-faint)' }}
            />
          </div>
          <h2 className="headline-sm text-ink mb-1">Nothing to analyze yet</h2>
          <p className="body-md text-secondary max-w-[32ch] mx-auto">
            Log a few sets in the Workout tab and your progress will show up here.
          </p>
        </div>
      </div>
    );
  }

  // Push/Pull/Legs split for the stacked balance bar
  const SPLITS: { label: string; muscles: MuscleGroup[]; color: string }[] = [
    {
      label: 'Push',
      color: 'var(--color-blue)',
      muscles: ['chest', 'shoulders', 'triceps'],
    },
    {
      label: 'Pull',
      color: '#7fb3f0',
      muscles: ['upperBack', 'biceps'],
    },
    {
      label: 'Legs',
      color: 'var(--color-faint)',
      muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    },
  ];

  const latestWeek = weeklyVolume?.[weeklyVolume.length - 1];
  const splitTotals = SPLITS.map((s) => ({
    ...s,
    volume: latestWeek
      ? s.muscles.reduce((n, m) => n + (latestWeek.volumes[m] ?? 0), 0)
      : 0,
  }));
  const splitSum = splitTotals.reduce((n, s) => n + s.volume, 0);

  return (
    <div className="px-5 pt-3">
      {/* Header */}
      <header className="mb-5">
        <h1 className="display-lg text-ink mb-1">Progress</h1>
        <p className="body-md text-tertiary">Estimated with Epley 1RM</p>
      </header>

      {/* Exercise picker */}
      <button
        type="button"
        onClick={() => setPickerOpen((o) => !o)}
        aria-expanded={pickerOpen}
        className="card pressable w-full flex items-center justify-between px-4 py-3 border-none cursor-pointer mb-4"
      >
        <span className="text-[15px] font-semibold text-ink">{activeName}</span>
        <MaterialIcon
          name="expand_more"
          size={22}
          style={{
            color: 'var(--color-secondary)',
            transform: pickerOpen ? 'rotate(180deg)' : undefined,
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden mb-4"
          >
            <div className="card row-sep overflow-hidden">
              {names.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setSelected(n);
                    setPickerOpen(false);
                  }}
                  className="pressable w-full px-4 py-2.5 text-left bg-card border-none cursor-pointer hover:bg-sunken"
                >
                  <span
                    className={`text-[15px] ${
                      n === activeName ? 'font-semibold' : ''
                    }`}
                    style={{ color: n === activeName ? 'var(--color-blue)' : 'var(--color-ink)' }}
                  >
                    {n}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Current', value: current1rm },
          { label: 'Best', value: best1rm },
          { label: 'Change', value: delta, signed: true },
        ].map(({ label, value, signed }) => (
          <div key={label} className="card p-3 flex flex-col items-center justify-center">
            <span className="section-label mb-1">{label}</span>
            <span
              className="text-[22px] font-semibold tnum"
              style={{
                letterSpacing: '-0.01em',
                color:
                  label === 'Change'
                    ? value == null || value === 0
                      ? 'var(--color-secondary)'
                      : value > 0
                        ? 'var(--color-green-ios)'
                        : 'var(--color-red)'
                    : 'var(--color-ink)',
              }}
            >
              {value == null
                ? '—'
                : `${signed && value > 0 ? '+' : ''}${Math.round(value)}`}
            </span>
          </div>
        ))}
      </div>

      {/* Plateau banner */}
      {plateaued && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3.5 mb-4 flex items-center gap-3"
          style={{
            background: 'var(--color-orange-soft)',
            border: '1px solid rgba(255,204,0,0.5)',
          }}
          role="status"
        >
          <MaterialIcon
            name="warning"
            size={22}
            fill={1}
            style={{ color: 'var(--color-orange)', flexShrink: 0 }}
          />
          <p className="body-md" style={{ color: 'var(--color-orange-text)' }}>
            Plateau detected in {activeName} volume.
          </p>
        </motion.div>
      )}

      {/* Chart card */}
      <div className="card p-5 mb-4">
        <h2 className="headline-sm text-ink mb-4">Estimated 1RM History</h2>
        <div className="h-48 -ml-2">
          {progression.length === 0 ? (
            <div className="h-full flex items-center justify-center body-md text-tertiary">
              No sets logged yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progression}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="rgba(209,209,214,0.5)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 11, fill: 'var(--color-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: 'var(--color-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(v) => [`${Math.round(Number(v))}`, 'Est. 1RM']}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    fontSize: 13,
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="oneRM"
                  stroke="#0071E3"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0071E3', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Weekly volume card */}
      {!volLoading && latestWeek && (
        <div className="card p-5 mb-4">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="headline-sm text-ink">Weekly sets</h2>
            <span className="body-md text-tertiary">sets / week</span>
          </div>
          <div className="space-y-4">
            {MUSCLE_GROUPS.map((m: MuscleGroup) => {
              const v = latestWeek.volumes[m];
              if (v <= 0) return null;
              const maxV = Math.max(...MUSCLE_GROUPS.map((mm) => latestWeek.volumes[mm]));
              return (
                <div key={m}>
                  <div className="flex justify-between label-caps mb-1">
                    <span style={{ color: 'var(--color-ink)' }}>
                      {MUSCLE_LABELS[m]}
                    </span>
                    <span style={{ color: 'var(--color-tertiary)' }} className="tnum">
                      {v % 1 === 0 ? v : v.toFixed(1)} set{v === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--color-sunken-high)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'var(--color-blue)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, (v / Math.max(1, maxV)) * 100)}%` }}
                      transition={spring}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="body-md text-faint mt-4">
            Secondaries count fractionally (0.5 set).
          </p>
        </div>
      )}

      {/* Volume alerts */}
      {risks.filter((r) => r.risk !== 'normal').length > 0 && (
        <section className="mb-4 space-y-2">
          {risks
            .filter(
              (r): r is VolumeRiskResult & { risk: 'overtrained' | 'undertrained' } =>
                r.risk !== 'normal'
            )
            .map((r) => (
              <div
                key={r.muscle}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  background:
                    r.risk === 'overtrained'
                      ? 'var(--color-red-soft)'
                      : 'var(--color-orange-soft)',
                }}
              >
                <MaterialIcon
                  name={r.risk === 'overtrained' ? 'error' : 'warning'}
                  size={20}
                  fill={1}
                  style={{
                    color:
                      r.risk === 'overtrained'
                        ? 'var(--color-red)'
                        : 'var(--color-orange)',
                    flexShrink: 0,
                  }}
                />
                <span className="text-[14px] font-medium text-ink">
                  {MUSCLE_LABELS[r.muscle]}
                </span>
                <span className="body-md ml-auto tnum text-secondary">
                  {r.label} · {Math.round(r.volume)} sets
                </span>
              </div>
            ))}
        </section>
      )}

      {/* Muscle balance — stacked bar with legend */}
      {splitSum > 0 && (
        <div className="card p-5 mb-2">
          <h2 className="headline-sm text-ink mb-4">Muscle balance</h2>
          <div
            className="flex h-4 rounded-full overflow-hidden"
            style={{ background: 'var(--color-sunken-high)' }}
          >
            {splitTotals.map((s) => (
              <motion.div
                key={s.label}
                initial={{ width: 0 }}
                animate={{ width: `${(s.volume / splitSum) * 100}%` }}
                transition={{ ...spring, delay: 0.05 }}
                style={{ background: s.color }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {splitTotals.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="label-caps" style={{ color: 'var(--color-tertiary)', textTransform: 'none', fontSize: 13 }}>
                  {s.label} ({Math.round((s.volume / splitSum) * 100)}%)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
