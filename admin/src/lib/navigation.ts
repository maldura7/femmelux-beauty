// Navigation helper for admin panel
// Handles base path prefix for DigitalOcean deployment

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Get the full path with base path prefix for navigation
 * Use this for all internal navigation in production
 */
export function getPath(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return BASE_PATH + path;
}

/**
 * Get the base path (empty in development, '/admin' in production)
 */
export function getBasePath(): string {
  return BASE_PATH;
}
