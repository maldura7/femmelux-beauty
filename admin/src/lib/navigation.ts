// Navigation helper for admin panel
// Handles base path prefix for DigitalOcean deployment

/**
 * Get the base path dynamically based on hostname
 * Returns '/admin' in production, '' in development
 */
function getBasePath(): string {
  // Check if we're in browser and not on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/admin';
    }
  }

  // Fall back to env variable or empty string
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Get the full path with base path prefix for navigation
 * Use this for all internal navigation in production
 */
export function getPath(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return getBasePath() + path;
}

export { getBasePath };
