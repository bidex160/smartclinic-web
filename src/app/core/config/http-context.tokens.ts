import { HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH_RETRY = new HttpContextToken<boolean>(() => false);

/** Keeps cookie-authorized public booking requests out of staff bearer-token handling. */
export const SKIP_STAFF_AUTH = new HttpContextToken<boolean>(() => false);
