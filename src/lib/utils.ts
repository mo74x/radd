/**
 * Lightweight, zero-dependency class name merger for Tailwind CSS classes.
 */
export function cn(...inputs: (string | number | boolean | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
