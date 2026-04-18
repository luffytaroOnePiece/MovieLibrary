/**
 * Shared cache configuration for all API services.
 * Edit TTL_MINUTES here to change the cache duration for both
 * the Spotify API and the TMDB API at once.
 */

export const TTL_MINUTES = 60;

/** Derived constant used internally by the API modules. */
export const CACHE_TTL_MS = TTL_MINUTES * 60 * 1000;
