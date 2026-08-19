/**
 * Validation for the ?from= hop between proxy.ts and the login flow.
 *
 * The value makes a round trip through the URL, so it is attacker-controllable
 * by the time it comes back. Both ends run it through here: the proxy before
 * writing it, the login flow before navigating to it. Anything that is not a
 * plain same-site path is discarded rather than repaired.
 *
 * Shared by the edge runtime and the browser bundle, so it must stay dependency
 * free.
 */
export const DEFAULT_REDIRECT = '/dashboard';

export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;

  // Must be an absolute path on this site.
  if (!value.startsWith('/')) return null;

  // '//host' and '/\host' are protocol-relative URLs: browsers navigate them
  // off-site, which would turn this into an open redirect.
  if (value.startsWith('//') || value.startsWith('/\\')) return null;

  // A backslash anywhere else can still be normalised into a separator, and
  // control characters can be used to smuggle one past a naive check.
  if (value.includes('\\')) return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;

  return value;
}

/** The validated destination, or the dashboard when the value is unusable. */
export function redirectTargetOrDefault(value: string | null | undefined): string {
  return safeRedirectPath(value) ?? DEFAULT_REDIRECT;
}
