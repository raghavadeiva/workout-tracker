/**
 * Vector math utilities for the client-side recommendation engine.
 * All computation is 100% local — no external API calls.
 *
 * All functions loop to `vector.length`, so they work for any dimensionality
 * (currently 20-dim muscle vectors from the generated library).
 */

/**
 * Computes the dot product of two numeric vectors.
 * Both vectors must be the same length.
 */
export function dotProduct(
  vecA: number[],
  vecB: number[]
): number {
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`
    );
  }
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += vecA[i] * vecB[i];
  }
  return sum;
}

/**
 * Computes the Euclidean magnitude (L2 norm) of a vector.
 */
export function magnitude(vec: number[]): number {
  let sumOfSquares = 0;
  for (let i = 0; i < vec.length; i++) {
    sumOfSquares += vec[i] * vec[i];
  }
  return Math.sqrt(sumOfSquares);
}

/**
 * Computes cosine similarity between two vectors.
 * Returns a score in [-1, 1] where:
 *   1  = vectors point in the same direction (identical)
 *   0  = vectors are orthogonal (no correlation)
 *  -1  = vectors point in opposite directions
 *
 * Formula: cos(theta) = dot(a, b) / (||a|| * ||b||)
 */
export function calculateCosineSimilarity(
  vecA: number[],
  vecB: number[]
): number {
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`
    );
  }

  const magA = magnitude(vecA);
  const magB = magnitude(vecB);

  // Guard against zero-magnitude vectors (all zeros)
  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProduct(vecA, vecB) / (magA * magB);
}
