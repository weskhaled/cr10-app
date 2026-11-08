/* Calendar-day arithmetic on ISO `YYYY-MM-DD` strings.
   Everything runs in UTC days so DST changes never shift a date. */

const DAY = 86_400_000

const toUTC = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return Date.UTC(y, m - 1, d)
}

const fromUTC = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

/** Local calendar date of `now` (not its UTC date). */
export function isoToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(iso: string, n: number): string {
  return fromUTC(toUTC(iso) + n * DAY)
}

/** Adds months, clamping to the last day of the target month (31 Mar − 1 month → 28/29 Feb). */
export function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  const lastDay = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate()
  return fromUTC(Date.UTC(y, m - 1 + n, Math.min(d, lastDay)))
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY)
}

// Latin digits in every language (Arabic included), like French administrative documents
export function formatDate(iso: string, locale = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' })
    .format(new Date(toUTC(iso)))
}
