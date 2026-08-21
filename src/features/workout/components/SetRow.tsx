import { motion } from 'framer-motion';
import type { WeightUnit } from '../../../db/database';
import { MaterialIcon } from '../../../components/MaterialIcon';

interface SetRowProps {
  setNumber: number;
  weight: number;
  reps: number;
  weightUnit: WeightUnit;
  onDelete: () => void;
}

export function SetRow({
  setNumber,
  weight,
  reps,
  weightUnit,
  onDelete,
}: SetRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className="flex items-center justify-between py-2.5 overflow-hidden hairline-b last:border-b-0"
    >
      <span className="flex items-center gap-4 min-w-0">
        <span className="font-bold text-faint w-6 text-center text-[15px] tnum">
          {setNumber}
        </span>
        <span className="text-[16px] font-semibold tnum whitespace-nowrap">
          {weight}{' '}
          <span className="text-faint font-normal">{weightUnit}</span>
          <span className="text-faint font-normal mx-1">×</span>
          {reps}
        </span>
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete set: ${weight} ${weightUnit} × ${reps}`}
        className="pressable w-9 h-9 -mr-1 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-red-soft"
      >
        <MaterialIcon
          name="delete"
          size={20}
          style={{ color: 'var(--color-red)' }}
        />
      </button>
    </motion.div>
  );
}
