/**
 * Returns true if the environment permits access to developer-only showcase pages.
 * Developer routes are strictly disabled when NODE_ENV is 'production'.
 */
export function isDevRouteAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}
