# Translating SmartClinic screens

Screens use `{{ 'namespace.key' | t }}` (pipe `TranslatePipe` from `core/services/translation.service`).
In TypeScript use `inject(TranslationService).t('namespace.key', { name })`.

## Files
- English source: `en/<namespace>.ts`. Every visible string lives here, copied **exactly** from the old template
  (tests check English wording).
- One file per language with the same keys: `pcm` Nigerian Pidgin, `yo` Yoruba, `ha` Hausa, `ig` Igbo,
  `tw` Twi (Asante), `rw` Kinyarwanda, `fr` French, `sw` Swahili.
- Keys: `namespace.area.thing`, lower camel case, e.g. `home.hero.title`, `auth.login.submit`.
- `i18n.spec.ts` fails if a language is missing a key, has an extra key, or changes a `{placeholder}`.

## Rules
1. Plain, everyday words a person with little schooling understands. Short sentences. Warm and respectful.
2. Keep these names in English everywhere (they are product names patients see on signs and hear from staff):
   **SmartClinic, Smart Health Check, Health Passport, Find Care, Guided Self-Check, My Hospital, SmartClinic ID, WhatsApp, Paystack**.
3. Keep `{placeholders}` exactly, never translate the word inside braces. Keep numbers, prices, emojis, "112".
4. Don't translate medical terms you're unsure of: give the simple meaning, then the English term in brackets once,
   e.g. Yoruba "ẹ̀jẹ̀ (genotype)".
5. Respectful forms: French "vous"; Yoruba plural/respectful "ẹ"; Swahili standard (Kenya/Tanzania); Kinyarwanda standard;
   Twi Asante with ɛ and ɔ; Hausa standard with ƙ ɗ ɓ ƴ; Igbo with ị ọ ụ ṅ; Yoruba with tone marks and ẹ ọ ṣ.
   Pidgin as written by BBC News Pidgin.
6. Buttons: a verb, 1–3 words. Don't make buttons much longer than the English.
7. Not a native speaker? The draft still goes in — but everything in `yo, ha, ig, rw, tw` must be checked by a native
   speaker before launch (see the review sheet).
