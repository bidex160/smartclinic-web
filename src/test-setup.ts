// Tests must not depend on the machine's time zone (the app guesses the country from it).
// Every test runs as if in Lagos; specs that test other countries choose them explicitly.
(globalThis as unknown as { process?: { env: Record<string, string> } }).process!.env['TZ'] = 'Africa/Lagos';
