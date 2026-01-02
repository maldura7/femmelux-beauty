/**
 * Convert a string to a URL-friendly slug
 *
 * @param text - The text to convert to a slug
 * @returns The slugified string
 *
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("Crème Brûlée") // "creme-brulee"
 * slugify("  Multiple   Spaces  ") // "multiple-spaces"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace accented characters with their non-accented equivalents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces with dashes
    .replace(/\s+/g, '-')
    // Remove all non-word characters except dashes
    .replace(/[^\w-]+/g, '')
    // Replace multiple dashes with a single dash
    .replace(/--+/g, '-')
    // Remove leading and trailing dashes
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generate a unique slug by appending a number if necessary
 *
 * @param baseSlug - The base slug
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export default slugify;
