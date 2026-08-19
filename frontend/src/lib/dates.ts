/**
 * Calendar-day helpers for the borrow window.
 *
 * Borrow dates come from <input type="date">, so they are calendar days with no
 * time of day. Comparing them against `new Date()` directly goes wrong for
 * seven hours of every day, because the server runs in UTC while the people
 * using it are in Bangkok: at 08:00 local it is still yesterday in UTC, and a
 * request for "today" would be rejected as backdated.
 *
 * Everything here therefore works on YYYY-MM-DD in one fixed zone, and turns it
 * into UTC midnight only for comparison, which is exactly how z.coerce.date()
 * parses the same string.
 */

/** The company operates in one place; there is no per-user timezone to honour. */
export const APP_TIME_ZONE = 'Asia/Bangkok';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Today's calendar date in the app's zone, as YYYY-MM-DD. */
export function todayInAppZone(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is what date inputs expect.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** UTC midnight of a YYYY-MM-DD string, matching how zod coerces the same value. */
export function startOfDayUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** UTC midnight of today's date in the app's zone. */
export function startOfTodayUtc(now: Date = new Date()): Date {
  return startOfDayUtc(todayInAppZone(now));
}

/** Shift a YYYY-MM-DD string by whole days, staying in YYYY-MM-DD. */
export function addDays(isoDate: string, days: number): string {
  const shifted = new Date(startOfDayUtc(isoDate).getTime() + days * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: Date, to: Date): number {
  const floor = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((floor(to) - floor(from)) / MS_PER_DAY);
}
