import { getRedisClient, isRedisConnected } from '../config/redis';
import { SearchResult, SearchSuggestions, PopularSearch } from '../services/search.service';

// ============================================
// CACHE CONFIGURATION
// ============================================

const CACHE_PREFIX = 'search:';
const SEARCH_RESULTS_TTL = 5 * 60; // 5 minutes
const SUGGESTIONS_TTL = 60 * 60; // 1 hour
const POPULAR_SEARCHES_TTL = 15 * 60; // 15 minutes
const PRODUCT_NAMES_TTL = 10 * 60; // 10 minutes

// ============================================
// CACHE KEY GENERATORS
// ============================================

/**
 * Generate cache key for search results
 */
function getSearchResultsKey(query: string, filters: Record<string, unknown>): string {
  const filterString = JSON.stringify(filters);
  return `${CACHE_PREFIX}results:${query.toLowerCase()}:${filterString}`;
}

/**
 * Generate cache key for search suggestions
 */
function getSuggestionsKey(query: string): string {
  return `${CACHE_PREFIX}suggestions:${query.toLowerCase()}`;
}

/**
 * Generate cache key for popular searches
 */
function getPopularSearchesKey(): string {
  return `${CACHE_PREFIX}popular`;
}

/**
 * Generate cache key for product names (for typo detection)
 */
function getProductNamesKey(): string {
  return `${CACHE_PREFIX}product_names`;
}

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Get cached search results
 */
export async function getCachedSearchResults(
  query: string,
  filters: Record<string, unknown>
): Promise<SearchResult | null> {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const client = getRedisClient();
    if (!client) return null;

    const key = getSearchResultsKey(query, filters);
    const cached = await client.get(key);

    if (cached) {
      return JSON.parse(cached) as SearchResult;
    }

    return null;
  } catch (error) {
    console.error('Error getting cached search results:', error);
    return null;
  }
}

/**
 * Cache search results
 */
export async function cacheSearchResults(
  query: string,
  filters: Record<string, unknown>,
  results: SearchResult
): Promise<void> {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const client = getRedisClient();
    if (!client) return;

    const key = getSearchResultsKey(query, filters);
    await client.setEx(key, SEARCH_RESULTS_TTL, JSON.stringify(results));
  } catch (error) {
    console.error('Error caching search results:', error);
  }
}

/**
 * Get cached suggestions
 */
export async function getCachedSuggestions(
  query: string
): Promise<SearchSuggestions | null> {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const client = getRedisClient();
    if (!client) return null;

    const key = getSuggestionsKey(query);
    const cached = await client.get(key);

    if (cached) {
      return JSON.parse(cached) as SearchSuggestions;
    }

    return null;
  } catch (error) {
    console.error('Error getting cached suggestions:', error);
    return null;
  }
}

/**
 * Cache suggestions
 */
export async function cacheSuggestions(
  query: string,
  suggestions: SearchSuggestions
): Promise<void> {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const client = getRedisClient();
    if (!client) return;

    const key = getSuggestionsKey(query);
    await client.setEx(key, SUGGESTIONS_TTL, JSON.stringify(suggestions));
  } catch (error) {
    console.error('Error caching suggestions:', error);
  }
}

/**
 * Get cached popular searches
 */
export async function getCachedPopularSearches(): Promise<PopularSearch[] | null> {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const client = getRedisClient();
    if (!client) return null;

    const key = getPopularSearchesKey();
    const cached = await client.get(key);

    if (cached) {
      return JSON.parse(cached) as PopularSearch[];
    }

    return null;
  } catch (error) {
    console.error('Error getting cached popular searches:', error);
    return null;
  }
}

/**
 * Cache popular searches
 */
export async function cachePopularSearches(
  searches: PopularSearch[]
): Promise<void> {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const client = getRedisClient();
    if (!client) return;

    const key = getPopularSearchesKey();
    await client.setEx(key, POPULAR_SEARCHES_TTL, JSON.stringify(searches));
  } catch (error) {
    console.error('Error caching popular searches:', error);
  }
}

/**
 * Get cached product names for typo detection
 */
export async function getCachedProductNames(): Promise<string[] | null> {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const client = getRedisClient();
    if (!client) return null;

    const key = getProductNamesKey();
    const cached = await client.get(key);

    if (cached) {
      return JSON.parse(cached) as string[];
    }

    return null;
  } catch (error) {
    console.error('Error getting cached product names:', error);
    return null;
  }
}

/**
 * Cache product names
 */
export async function cacheProductNames(names: string[]): Promise<void> {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const client = getRedisClient();
    if (!client) return;

    const key = getProductNamesKey();
    await client.setEx(key, PRODUCT_NAMES_TTL, JSON.stringify(names));
  } catch (error) {
    console.error('Error caching product names:', error);
  }
}

// ============================================
// CACHE INVALIDATION
// ============================================

/**
 * Clear all search-related caches
 */
export async function clearSearchCache(): Promise<void> {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const client = getRedisClient();
    if (!client) return;

    // Get all search cache keys
    const keys = await client.keys(`${CACHE_PREFIX}*`);

    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Cleared ${keys.length} search cache entries`);
    }
  } catch (error) {
    console.error('Error clearing search cache:', error);
  }
}

/**
 * Clear search results cache (keep suggestions)
 */
export async function clearSearchResultsCache(): Promise<void> {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const client = getRedisClient();
    if (!client) return;

    const keys = await client.keys(`${CACHE_PREFIX}results:*`);

    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Cleared ${keys.length} search results cache entries`);
    }
  } catch (error) {
    console.error('Error clearing search results cache:', error);
  }
}

/**
 * Clear product names cache (call when products are updated)
 */
export async function clearProductNamesCache(): Promise<void> {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const client = getRedisClient();
    if (!client) return;

    const key = getProductNamesKey();
    await client.del(key);
  } catch (error) {
    console.error('Error clearing product names cache:', error);
  }
}

/**
 * Clear popular searches cache
 */
export async function clearPopularSearchesCache(): Promise<void> {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const client = getRedisClient();
    if (!client) return;

    const key = getPopularSearchesKey();
    await client.del(key);
  } catch (error) {
    console.error('Error clearing popular searches cache:', error);
  }
}

export default {
  getCachedSearchResults,
  cacheSearchResults,
  getCachedSuggestions,
  cacheSuggestions,
  getCachedPopularSearches,
  cachePopularSearches,
  getCachedProductNames,
  cacheProductNames,
  clearSearchCache,
  clearSearchResultsCache,
  clearProductNamesCache,
  clearPopularSearchesCache,
};
