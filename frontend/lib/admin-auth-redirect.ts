/** Thrown from admin-api when there is no adminToken (before hitting the network). */
export const ADMIN_AUTH_REDIRECT_MESSAGE = 'Not authenticated';

export function isAdminAuthRedirectError(e: unknown): e is Error {
  return e instanceof Error && e.message === ADMIN_AUTH_REDIRECT_MESSAGE;
}
