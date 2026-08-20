import { useState } from 'react';
import { Replace, X } from 'lucide-react';
import { useRecommendations } from '../../recommendations/useRecommendations';
import type { RecommendationResult } from '../../recommendations/exerciseVectors';

interface ExerciseSwapProps {
	exerciseName: string;
	availableEquipment: string[];
	onSwapExercise: (oldName: string, newName: string) => void;
}

/**
 * ExerciseSwap — shows a button that, when clicked, fetches
 * cosine-similarity-based exercise substitution suggestions and
 * allows the user to swap the current exercise for a recommended one.
 *
 * Context-aware: filters by available equipment.
 */
export function ExerciseSwap({
	exerciseName,
	availableEquipment,
	onSwapExercise,
}: ExerciseSwapProps) {
	const [isOpen, setIsOpen] = useState(false);

	const { recommendations, isLoading, error } = useRecommendations(exerciseName, {
		topN: 3,
		availableEquipment: availableEquipment.length > 0 ? availableEquipment : undefined,
	});

	const handleSwap = (newExercise: string) => {
		onSwapExercise(exerciseName, newExercise);
		setIsOpen(false);
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
				aria-label={`Find alternatives for ${exerciseName}`}
			>
				<Replace className="w-4 h-4" />
			</button>

			{isOpen && (
				<div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
					<div className="p-3 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
								Alternatives
							</span>
							<button
								onClick={() => setIsOpen(false)}
								className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
							>
								<X className="w-3 h-3" />
							</button>
						</div>
					</div>

					<div className="p-2 max-h-48 overflow-y-auto">
						{isLoading && (
							<div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
								Finding alternatives...
							</div>
						)}

						{error && (
							<div className="px-3 py-2 text-sm text-red-500">
								{error}
							</div>
						)}

						{recommendations && recommendations.length > 0 ? (
							<div className="space-y-1">
								{recommendations.map((rec: RecommendationResult) => (
									<button
										key={rec.exercise}
										onClick={() => handleSwap(rec.exercise)}
										className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
									>
										<span className="font-medium text-gray-900 dark:text-gray-100">
											{rec.exercise}
										</span>
										<span className="text-xs font-mono text-gray-500 dark:text-gray-400">
											{Math.round(rec.score * 100)}%
										</span>
									</button>
								))}
							</div>
						) : (
							!isLoading && !error && (
								<div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
									No alternatives found
								</div>
							)
						)}
					</div>
				</div>
			)}
		</div>
	);
}
