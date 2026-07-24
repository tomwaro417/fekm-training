/**
 * Utilitaires de recherche et scoring de pertinence.
 */

export interface ScoredItem<T> {
  item: T
  score: number
}

/**
 * Normalise une chaîne pour la recherche :
 * - minuscules
 * - suppression des accents
 * - trim
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Vérifie si une chaîne normalisée contient la requête normalisée.
 */
export function containsNormalized(haystack: string, needle: string): boolean {
  return normalizeText(haystack).includes(normalizeText(needle))
}

const SCORES = {
  EXACT_NAME_MATCH: 1000,
  STARTS_WITH_NAME: 500,
  WORD_START_NAME: 300,
  CONTAINS_NAME: 200,
  STARTS_WITH_OTHER: 100,
  CONTAINS_OTHER: 50,
  CONTAINS_KEYWORDS: 30,
} as const

/**
 * Calcule un score de pertinence pour un item.
 *
 * Règles (dans l'ordre de priorité) :
 * - 1000 : le nom correspond exactement (après normalisation)
 * - 500  : le nom commence par la requête
 * - 300  : un mot du nom commence par la requête
 * - 200  : le nom contient la requête
 * - 100  : un champ secondaire commence par la requête
 * - 50   : un champ secondaire contient la requête
 * - 30   : les mots-clés/points clés contiennent la requête
 */
export function calculateRelevanceScore(
  query: string,
  name: string,
  secondaryFields: string[] = [],
  keywords: string[] = []
): number {
  const q = normalizeText(query)
  const n = normalizeText(name)

  if (!q || !n) return 0

  let score = 0

  // Match exact sur le nom
  if (n === q) {
    score += SCORES.EXACT_NAME_MATCH
  }

  // Le nom commence par la requête
  if (n.startsWith(q)) {
    score += SCORES.STARTS_WITH_NAME
  }

  // Un mot du nom commence par la requête
  const nameWords = n.split(/\s+/)
  if (nameWords.some((word) => word.startsWith(q))) {
    score += SCORES.WORD_START_NAME
  }

  // Le nom contient la requête
  if (n.includes(q)) {
    score += SCORES.CONTAINS_NAME
  }

  // Champs secondaires (description, code, etc.)
  secondaryFields.forEach((field) => {
    const f = normalizeText(field)
    if (!f) return

    if (f.startsWith(q)) {
      score += SCORES.STARTS_WITH_OTHER
    }
    if (f.includes(q)) {
      score += SCORES.CONTAINS_OTHER
    }
  })

  // Mots-clés / points clés
  keywords.forEach((keyword) => {
    const k = normalizeText(keyword)
    if (k && k.includes(q)) {
      score += SCORES.CONTAINS_KEYWORDS
    }
  })

  return score
}

/**
 * Trie une liste d'items par score décroissant et la limite.
 */
export function sortByRelevance<T extends { score: number }>(
  items: T[],
  limit?: number
): T[] {
  const sorted = items.sort((a, b) => b.score - a.score)
  return limit ? sorted.slice(0, limit) : sorted
}
