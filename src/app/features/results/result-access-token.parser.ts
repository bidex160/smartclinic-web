const RESULT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function parseResultAccessToken(value: string, applicationOrigin: string): string | null {
  const trimmed = value.trim();
  if (RESULT_TOKEN_PATTERN.test(trimmed)) return trimmed;
  let parsed: URL;
  try {
    parsed = new URL(trimmed, applicationOrigin);
  } catch {
    return null;
  }
  if (parsed.origin !== new URL(applicationOrigin).origin || parsed.search || parsed.hash)
    return null;
  const match = /^\/health-results\/([^/]+)\/?$/.exec(parsed.pathname);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1]);
    return RESULT_TOKEN_PATTERN.test(token) ? token : null;
  } catch {
    return null;
  }
}
