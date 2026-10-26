/* Deadline engine: works backwards from the titre de séjour expiry to
   the ANEF filing window, the last useful exam date and the last day to
   book it, then sizes the daily workload to fit.

   The constants are typical values (not legal limits) — confirm the
   window with the préfecture and the result delay with the exam centre. */
import type { Settings } from '../types/study'
import { addDays, addMonths, daysBetween } from './dates'

export const FILING_OPENS_MONTHS = 4 // ANEF window opens ~4 months before expiry
export const FILING_CLOSES_MONTHS = 2 // …and closes ~2 months before
export const RESULT_DAYS = 28 // TCF/TEF results: up to ~4 weeks (also assumed for the civic exam)
export const BOOKING_LEAD_DAYS = 21 // sessions close registration ~3 weeks ahead
export const BUFFER_DAYS = 3 // last days before an exam: reviews only, no new items
export const MIN_NEW_PER_DAY = 5

export type Phase = 'prep' | 'filing' | 'late' | 'expired'

export interface ExamStatus {
  date: string // booked date, or the latest useful date as a planning target
  booked: boolean
  daysLeft: number
  tooLate: boolean // booked, but results would land after the filing window closes
}

export interface Deadline {
  filingOpens: string
  filingCloses: string
  latestExam: string // last exam date whose results still arrive before the window closes
  latestBooking: string // last day to register for that session
  phase: Phase
  daysToExpiry: number
  daysToFilingClose: number
  civic: ExamStatus
  french: ExamStatus
}

export function computeDeadline(settings: Settings, today: string): Deadline {
  const { expiry } = settings
  const filingOpens = addMonths(expiry, -FILING_OPENS_MONTHS)
  const filingCloses = addMonths(expiry, -FILING_CLOSES_MONTHS)
  const latestExam = addDays(filingCloses, -RESULT_DAYS)
  const latestBooking = addDays(latestExam, -BOOKING_LEAD_DAYS)

  const phase: Phase =
    today >= expiry ? 'expired' : today > filingCloses ? 'late' : today >= filingOpens ? 'filing' : 'prep'

  const exam = (booked: string): ExamStatus => {
    const date = booked || latestExam
    return { date, booked: !!booked, daysLeft: daysBetween(today, date), tooLate: !!booked && booked > latestExam }
  }

  return {
    filingOpens,
    filingCloses,
    latestExam,
    latestBooking,
    phase,
    daysToExpiry: daysBetween(today, expiry),
    daysToFilingClose: daysBetween(today, filingCloses),
    civic: exam(settings.civicExam),
    french: exam(settings.frenchExam),
  }
}

/** New items per day so every unseen item is met once before the exam,
    leaving the last BUFFER_DAYS for reviews only. */
export function dailyNewQuota(unseen: number, today: string, examDate: string): number {
  if (unseen <= 0) return 0
  const studyDays = Math.max(1, daysBetween(today, examDate) - BUFFER_DAYS)
  return Math.min(unseen, Math.max(MIN_NEW_PER_DAY, Math.ceil(unseen / studyDays)))
}
