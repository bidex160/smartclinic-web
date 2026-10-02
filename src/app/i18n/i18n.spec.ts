import { describe, expect, it } from 'vitest';

import en from './en';
import fr from './fr';
import ha from './ha';
import ig from './ig';
import pcm from './pcm';
import rw from './rw';
import sw from './sw';
import tw from './tw';
import yo from './yo';
import { interpolate } from '../core/services/translation.service';

const languages = { pcm, yo, ha, ig, rw, fr, sw, tw };
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('translations', () => {
  it('has English text for every key, and no empty strings', () => {
    for (const [key, text] of Object.entries(en)) expect(text.trim(), key).not.toBe('');
  });

  for (const [code, dict] of Object.entries(languages)) {
    it(`${code}: same keys as English, same placeholders, nothing empty`, () => {
      const missing = Object.keys(en).filter((k) => !(k in dict));
      const extra = Object.keys(dict).filter((k) => !(k in en));
      expect(missing, `missing in ${code}`).toEqual([]);
      expect(extra, `extra in ${code}`).toEqual([]);
      for (const [key, text] of Object.entries(dict)) {
        expect(text.trim(), `${code} ${key}`).not.toBe('');
        expect(placeholders(text), `${code} ${key} placeholders`).toEqual(placeholders(en[key]));
      }
    });
  }

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(interpolate('Hello {name}, {n} new', { name: 'Ada', n: 2 })).toBe('Hello Ada, 2 new');
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
  });
});
