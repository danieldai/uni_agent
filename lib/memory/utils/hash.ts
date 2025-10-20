/**
 * Hash Generation Utilities
 *
 * Functions for generating consistent hashes for memory deduplication.
 */

import CryptoJS from 'crypto-js';

/**
 * Normalize text for consistent hashing
 * Removes extra whitespace, converts to lowercase, and trims
 * @param text Text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
}

/**
 * Generate SHA256 hash for a memory text
 * Uses normalization to ensure similar text produces same hash
 * @param text Memory text to hash
 * @param options Hashing options
 * @returns Hash string
 */
export function generateHash(
  text: string,
  options: {
    normalize?: boolean;
    algorithm?: 'sha256' | 'md5';
  } = {}
): string {
  const {
    normalize = true,
    algorithm = 'sha256',
  } = options;

  // Normalize text if requested
  const processedText = normalize ? normalizeText(text) : text;

  // Generate hash based on algorithm
  let hash: CryptoJS.lib.WordArray;
  switch (algorithm) {
    case 'md5':
      hash = CryptoJS.MD5(processedText);
      break;
    case 'sha256':
    default:
      hash = CryptoJS.SHA256(processedText);
      break;
  }

  return hash.toString();
}

/**
 * Generate short hash (first 16 characters)
 * Useful for display or when full hash is not needed
 * @param text Text to hash
 * @param options Hashing options
 * @returns Short hash string
 */
export function generateShortHash(
  text: string,
  options?: {
    normalize?: boolean;
    algorithm?: 'sha256' | 'md5';
  }
): string {
  const fullHash = generateHash(text, options);
  return fullHash.substring(0, 16);
}

/**
 * Check if two texts would produce the same hash
 * Useful for deduplication checks before generating hash
 * @param text1 First text
 * @param text2 Second text
 * @param normalize Whether to normalize before comparison
 * @returns True if texts would hash to same value
 */
export function isSameHash(
  text1: string,
  text2: string,
  normalize = true
): boolean {
  const hash1 = generateHash(text1, { normalize });
  const hash2 = generateHash(text2, { normalize });
  return hash1 === hash2;
}

/**
 * Generate hashes for multiple texts
 * @param texts Array of texts to hash
 * @param options Hashing options
 * @returns Array of hashes
 */
export function generateHashes(
  texts: string[],
  options?: {
    normalize?: boolean;
    algorithm?: 'sha256' | 'md5';
  }
): string[] {
  return texts.map(text => generateHash(text, options));
}

/**
 * Find duplicate texts based on hash
 * @param texts Array of texts to check
 * @param options Hashing options
 * @returns Object with hash as key and array of duplicate texts
 */
export function findDuplicates(
  texts: string[],
  options?: {
    normalize?: boolean;
    algorithm?: 'sha256' | 'md5';
  }
): Record<string, string[]> {
  const duplicates: Record<string, string[]> = {};

  texts.forEach(text => {
    const hash = generateHash(text, options);
    if (!duplicates[hash]) {
      duplicates[hash] = [];
    }
    duplicates[hash].push(text);
  });

  // Filter to only return hashes with duplicates
  return Object.fromEntries(
    Object.entries(duplicates).filter(([_, texts]) => texts.length > 1)
  );
}

/**
 * Create a hash-to-text mapping
 * @param texts Array of texts
 * @param options Hashing options
 * @returns Map of hash to text
 */
export function createHashMap(
  texts: string[],
  options?: {
    normalize?: boolean;
    algorithm?: 'sha256' | 'md5';
  }
): Map<string, string> {
  const hashMap = new Map<string, string>();

  texts.forEach(text => {
    const hash = generateHash(text, options);
    // Store first occurrence only (deduplicate)
    if (!hashMap.has(hash)) {
      hashMap.set(hash, text);
    }
  });

  return hashMap;
}

/**
 * Generate hash with user ID prefix for user-specific deduplication
 * @param text Memory text
 * @param userId User ID
 * @param options Hashing options
 * @returns Hash with user prefix
 */
export function generateUserHash(
  text: string,
  userId: string,
  options?: {
    normalize?: boolean;
    algorithm?: 'sha256' | 'md5';
  }
): string {
  const combinedText = `${userId}:${text}`;
  return generateHash(combinedText, options);
}

/**
 * Validate hash format
 * @param hash Hash string to validate
 * @param algorithm Expected algorithm
 * @returns True if hash format is valid
 */
export function isValidHash(
  hash: string,
  algorithm: 'sha256' | 'md5' = 'sha256'
): boolean {
  if (typeof hash !== 'string') {
    return false;
  }

  // SHA256 produces 64 hex characters, MD5 produces 32
  const expectedLength = algorithm === 'sha256' ? 64 : 32;
  const hexPattern = /^[a-f0-9]+$/i;

  return hash.length === expectedLength && hexPattern.test(hash);
}

/**
 * Compare normalized texts for similarity
 * Returns true if normalized texts are identical
 * @param text1 First text
 * @param text2 Second text
 * @returns True if normalized texts match
 */
export function areTextsSimilar(text1: string, text2: string): boolean {
  return normalizeText(text1) === normalizeText(text2);
}
