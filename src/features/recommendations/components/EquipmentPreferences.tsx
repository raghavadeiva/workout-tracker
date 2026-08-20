import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
		<div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 py-2"
			>
				<span>Available Equipment</span>
				{isExpanded ? (
					<ChevronUp className="w-4 h-4 text-gray-500" />
				) : (
					<ChevronDown className="w-4 h-4 text-gray-500" />
				)}
			</button>

			{isExpanded && (
				<div className="flex flex-wrap gap-2 mt-2">
					{EQUIPMENT_TYPES.map((equip) => {
						const isActive = availableEquipment.includes(equip);
						return (
							<button
								key={equip}
								type="button"
								onClick={() => toggleEquipment(equip)}
								className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
									isActive
										? 'bg-blue-600 text-white'
										: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
								}`}
							>
								{equip}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
