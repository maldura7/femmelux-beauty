// Navigation helper for admin panel
// Works with both Vercel (separate domains) and local development

/**
 * Get the base path - returns empty string for Vercel/local
 * since each app gets its own domain on Vercel
 */
function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Get the full path for navigation
 * With Vercel, no base path is needed since admin gets its own domain
 */
export function getPath(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return getBasePath() + path;
}

export { getBasePath };
