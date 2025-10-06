/**
 * User identification utilities for anonymous challenge tracking
 */


/**
 * Gets the global user ID for challenge tracking
 * Returns consistent ID across all devices and sessions for shared challenge progress
 */
export function getAnonymousUserId(): string {
  // Return global ID for shared challenge progress across all devices
  return 'global';
}

/**
 * Clears the anonymous user ID (useful for testing or reset functionality)
 */
export function clearAnonymousUserId(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('vox_anonymous_user_id');
    } catch (error) {
      console.warn('Could not clear anonymous user ID:', error);
    }
  }
}

/**
 * Extracts user ID from request headers or returns global ID
 * For API routes that need to identify users
 */
export function getUserIdFromRequest(request: Request): string {
  // Check for custom header (if we add authentication later)
  const userIdHeader = request.headers.get('x-user-id');
  if (userIdHeader) {
    return userIdHeader;
  }

  // Return global ID for shared challenge progress across all devices
  return 'global';
}