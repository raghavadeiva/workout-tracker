import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EQUIPMENT_TYPES } from '../useRecommendations';

interface EquipmentPreferencesProps {
  availableEquipment: string[];
  onSetAvailableEquipment: (equipment: string[]) => void;
}

/**
 * EquipmentPreferences — a collapsible panel that lets users toggle
 * which equipment they have available. Used to filter exercise recommendations.
 */
export function EquipmentPreferences({
  availableEquipment,
  onSetAvailableEquipment,
}: EquipmentPreferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleEquipment = (equip: string) => {
    const updated = availableEquipment.includes(equip)
      ? availableEquipment.filter((e: string) => e !== equip)
      : [...availableEquipment, equip];
    onSetAvailableEquipment(updated);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] material border-t border-[--color-separator] dark:border-gray-800">
      {/* Trigger */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 tap-feedback"
      >
        <span>Available Equipment</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ type: 'spring' as const, damping: 1.0, stiffness: 400 }}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </motion.div>
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: 'spring' as const,
              damping: 0.9,
              stiffness: 400,
              opacity: { duration: 0.15 },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 pb-[env(safe-area-inset-bottom)]">
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_TYPES.map((equip) => {
                  const isActive = availableEquipment.includes(equip);
                  return (
                    <motion.button
                      key={equip}
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleEquipment(equip)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all tap-feedback ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-elevated'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {equip}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
