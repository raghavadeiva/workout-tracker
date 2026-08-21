import { useState, useEffect, useRef } from 'react';
import type { WeightUnit } from '../../../db/database';
import { MaterialIcon } from '../../../components/MaterialIcon';

interface SetInputProps {
  exerciseName: string;
  previousWeight?: number;
  previousReps?: number;
  nextSetNumber: number;
  weightUnit: WeightUnit;
  onLogSet: (weight: number, reps: number) => void;
}

export function SetInput({
  exerciseName,
  previousWeight,
  previousReps,
  nextSetNumber,
  weightUnit,
  onLogSet,
}: SetInputProps) {
  const [weight, setWeight] = useState<string>(
    previousWeight != null ? String(previousWeight) : ''
  );
  const [reps, setReps] = useState<string>(
    previousReps != null ? String(previousReps) : ''
  );
  const [flash, setFlash] = useState(false);
  const repsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWeight(previousWeight != null ? String(previousWeight) : '');
    setReps('');
  }, [exerciseName, previousWeight, previousReps]);

  const step = (field: 'w' | 'r', delta: number) => {
    if (field === 'w') {
      const cur = parseFloat(weight) || 0;
      setWeight(String(Math.max(0, +(cur + delta).toFixed(1))));
    } else {
      const cur = parseInt(reps) || 0;
      setReps(String(Math.max(0, cur + delta)));
    }
  };

  const valid = parseFloat(weight) > 0 && parseInt(reps) > 0;

  const commit = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (!valid || !w || !r) return;
    onLogSet(w, r);
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
    setReps('');
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Weight */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`w-${nextSetNumber}`}
            className="section-label ml-1"
          >
            Weight ({weightUnit})
          </label>
          <div className="stepper-field">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => step('w', -2.5)}
              aria-label="Decrease weight"
            >
              <MaterialIcon name="remove" size={20} />
            </button>
            <input
              id={`w-${nextSetNumber}`}
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && repsRef.current?.focus()}
              placeholder="0"
              aria-label={`Weight in ${weightUnit}`}
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => step('w', 2.5)}
              aria-label="Increase weight"
            >
              <MaterialIcon name="add" size={20} />
            </button>
          </div>
        </div>

        {/* Reps */}
        <div className="flex flex-col gap-1">
          <label htmlFor={`r-${nextSetNumber}`} className="section-label ml-1">
            Reps
          </label>
          <div className="stepper-field">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => step('r', -1)}
              aria-label="Decrease reps"
            >
              <MaterialIcon name="remove" size={20} />
            </button>
            <input
              ref={repsRef}
              id={`r-${nextSetNumber}`}
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              placeholder="0"
              aria-label="Repetitions"
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => step('r', 1)}
              aria-label="Increase reps"
            >
              <MaterialIcon name="add" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Log Set — black CTA, flashes green on commit */}
      <button
        type="button"
        className="btn-primary"
        style={flash ? { background: 'var(--color-green)' } : undefined}
        onClick={commit}
        disabled={!valid}
      >
        {flash ? (
          <>
            <MaterialIcon name="check" size={20} /> Logged
          </>
        ) : (
          <>
            <MaterialIcon name="check" size={20} /> Log Set
          </>
        )}
      </button>
    </div>
  );
}
