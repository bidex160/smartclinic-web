import { describe, expect, it } from 'vitest';

import { DAILY_TIPS, seasonFor, tipForDate } from './daily-tips';

describe('daily tips', () => {
  it('follows the Nigerian seasons', () => {
    expect(seasonFor(new Date(2026, 6, 15))).toBe('rainy');
    expect(seasonFor(new Date(2026, 11, 15))).toBe('harmattan');
    expect(seasonFor(new Date(2026, 0, 15))).toBe('harmattan');
    expect(seasonFor(new Date(2026, 2, 15))).toBe('any');
  });

  it('is stable for a day and never shows an out-of-season tip', () => {
    for (let day = 1; day <= 365; day++) {
      const date = new Date(2026, 0, day);
      const tip = tipForDate(date);
      expect(tipForDate(new Date(2026, 0, day, 23, 59))).toBe(tip);
      expect(['any', seasonFor(date)]).toContain(tip.season);
    }
  });

  it('keeps every tip short enough for a phone card', () => {
    for (const tip of DAILY_TIPS) expect(tip.body.length).toBeLessThanOrEqual(160);
  });
});
