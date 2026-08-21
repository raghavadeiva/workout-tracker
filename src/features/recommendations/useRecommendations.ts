/**
 * Reactive hook for the client-side recommendation engine.
 *
 * Wraps `getRecommendations()` over the generated 873-exercise library with:
 * - Memoized computation (recomputed only when inputs change)
 * - Context-aware equipment filtering (bucket-based, Phase 14)
 *
 * All computation is 100% local — no external API calls.
 */

import { useMemo } from 'react';
import {
	getRecommendations,
	getAllExerciseNames,
	getEquipmentBuckets,
} from './exerciseVectors';
import type { RecommendationResult } from './exerciseVectors';

/** Equipment types available for context-aware filtering. */
export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight';

/** All equipment filter buckets offered in the UI. */
export const EQUIPMENT_TYPES: EquipmentType[] = [
	'barbell',
	'dumbbell',
	'machine',
	'bodyweight',
];

/**
 * Reactive hook that computes exercise substitution recommendations
 * for a given target exercise, ranked by cosine similarity.
 *
 * @param targetExercise - The exercise to find substitutes for (display name),
 *   or null to skip computation (returns null recommendations).
 * @param options - Optional configuration.
 * @param options.topN - Number of results to return (default: 2).
 * @param options.availableEquipment - Equipment the user has access to
 *   (e.g. ['barbell', 'dumbbell']). When provided, results are filtered to
 *   exercises whose equipment is fully covered. Exercises with no mapped
 *   equipment ("other", bands, etc.) are treated as always available.
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
	const topN = options?.topN ?? 2;
	const availableEquipment = options?.availableEquipment;

	const allExerciseNames = useMemo(() => getAllExerciseNames(), []);

	const recommendations = useMemo<RecommendationResult[] | null>(() => {
		if (!targetExercise) return null;

		try {
			let results = getRecommendations(targetExercise, topN * 3);

			if (availableEquipment && availableEquipment.length > 0) {
				const availableSet = new Set(availableEquipment);
				results = results.filter((rec) => {
					const buckets = getEquipmentBuckets(rec.exercise);
					// No mapped equipment → always available
					if (buckets.size === 0) return true;
					for (const bucket of buckets) {
						if (!availableSet.has(bucket)) return false;
					}
					return true;
				});
			}

			return results.length > 0 ? results.slice(0, topN) : null;
		} catch (err) {
			console.error('Recommendation computation failed:', err);
			return null;
		}
	}, [targetExercise, topN, availableEquipment]);

	return { recommendations, isLoading: false, error: null, allExerciseNames };
}
