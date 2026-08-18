import { parseResultAccessToken } from './result-access-token.parser';

describe('parseResultAccessToken', () => {
  const token = 'a'.repeat(43);
  it('accepts a token or expected same-origin result URL', () => {
    expect(parseResultAccessToken(token, 'https://clinic.example')).toBe(token);
    expect(
      parseResultAccessToken(
        `https://clinic.example/health-results/${token}`,
        'https://clinic.example',
      ),
    ).toBe(token);
    expect(parseResultAccessToken(`/health-results/${token}`, 'https://clinic.example')).toBe(
      token,
    );
  });
  it.each([
    `https://evil.example/health-results/${token}`,
    `https://clinic.example/book/${token}`,
    `https://clinic.example/health-results/${token}?status=ok`,
    'not-a-token',
  ])('rejects unexpected input %s', (value) =>
    expect(parseResultAccessToken(value, 'https://clinic.example')).toBeNull(),
  );
});
