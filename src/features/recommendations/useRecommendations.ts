/**
 * Reactive hook for the client-side recommendation engine.
 *
 * Wraps `getRecommendations()` from `exerciseVectors.ts` with:
 * - React state management
 * - Memoized computation (invalidated only on exercise set changes)
 * - Context-aware equipment filtering
 *
 * All computation is 100% local — no external API calls.
 */

import { useState, useEffect, useMemo } from 'react';
import {
	getRecommendations,
	getAllExerciseNames,
	EXERCISE_VECTORS,
	VECTOR_DIMENSIONS,
} from './exerciseVectors';
import type { RecommendationResult } from './exerciseVectors';

/** Equipment types available for context-aware filtering. */
export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight';

/** All equipment types indexed in the vector dimensions. */
export const EQUIPMENT_TYPES: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'bodyweight'];

/**
 * Reactive hook that fetches exercise substitution recommendations
 * for a given target exercise, ranked by cosine similarity.
 *
 * Results are memoized on the target exercise name and equipment filter,
 * recomputing only when those inputs change.
 *
 * @param targetExercise - The exercise to find substitutes for.
 * @param options - Optional configuration.
 * @param options.topN - Number of results to return (default: 2).
 * @param options.availableEquipment - Equipment the user has access to
 *   (e.g. ['barbell', 'dumbbell']). When provided, results are filtered to
 *   exercises that use only available equipment.
 *
 * @returns {
 *   recommendations: RecommendationResult[] | null,
 *   isLoading: boolean,
 *   error: string | null,
 *   allExerciseNames: string[],
 * }
 */
export function useRecommendations(
	targetExercise: string | null,
	options?: {
		topN?: number;
		availableEquipment?: string[];
	}
) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const topN = options?.topN ?? 2;
	const availableEquipment = options?.availableEquipment;

	// All exercise names are available synchronously (hardcoded vectors)
	const allExerciseNames = useMemo(() => getAllExerciseNames(), []);

	const recommendations = useMemo<RecommendationResult[] | null>(() => {
		if (!targetExercise) return null;

		try {
			// Get top results from the vector engine (fetch extra for equipment filtering)
			let results = getRecommendations(targetExercise, topN * 3);

			// Apply equipment filtering if context is provided
			if (availableEquipment && availableEquipment.length > 0) {
				const availableSet = new Set(availableEquipment);
				results = results.filter((rec) => {
					const vector = EXERCISE_VECTORS[rec.exercise];
					if (!vector) return false;
					// Check which equipment dimensions are active in the vector
					const equipmentDimStart = VECTOR_DIMENSIONS.indexOf('barbell');
					const equipmentDimEnd = VECTOR_DIMENSIONS.indexOf('bodyweight');
					for (let i = equipmentDimStart; i <= equipmentDimEnd; i++) {
						if (vector[i] > 0) {
							const equipType = VECTOR_DIMENSIONS[i] as EquipmentType;
							if (!availableSet.has(equipType)) {
								return false;
							}
						}
					}
					return true;
				});

				// Re-sort after filtering and take top N
				results = results
					.sort((a, b) => b.score - a.score)
					.slice(0, topN);
			}

			setError(null);
			return results.length > 0 ? results : null;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to compute recommendations');
			return null;
		}
	}, [targetExercise, topN, availableEquipment]);

	// isLoading is effectively always false since vectors are in-memory,
	// but we keep the interface consistent for future async vector storage
	useEffect(() => {
		if (recommendations !== null || targetExercise === null) {
			setIsLoading(false);
		}
	}, [recommendations, targetExercise]);

	return {
		recommendations,
		isLoading,
		error,
		allExerciseNames,
	};
}
