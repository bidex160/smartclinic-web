import { describe, expect, it } from 'vitest';
import { safeInternalReturnUrl } from './safe-return-url';

describe('safeInternalReturnUrl', () => {
  it.each([
    '/me/health-journey',
    '/me/providers/connect',
    '/health-check/packages?package=ESSENTIAL',
  ])('accepts internal application destination %s', (url) => {
    expect(safeInternalReturnUrl(url)).toBe(url);
  });

  it.each([
    'https://example.com',
    '//example.com/path',
    '/\\example.com/path',
    'javascript:alert(1)',
    ' /me/dashboard',
    '',
  ])('rejects unsafe or malformed destination %s', (url) => {
    expect(safeInternalReturnUrl(url)).toBeNull();
  });
});
