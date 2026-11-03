import { describe, expect, it } from 'vitest'
import { addDays, addMonths, daysBetween } from '../app/utils/dates'
import { computeDeadline, dailyNewQuota } from '../app/utils/deadline'

const settings = { expiry: '2027-03-01', civicExam: '', frenchExam: '', commuteMin: 20, verifiedAudioOnly: false }

describe('dates', () => {
  it('adds months and clamps to the end of the month', () => {
    expect(addMonths('2027-03-01', -4)).toBe('2026-11-01')
    expect(addMonths('2027-03-31', -1)).toBe('2027-02-28')
    expect(addMonths('2028-03-31', -1)).toBe('2028-02-29')
  })
  it('counts days across the DST change', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
  })
})

describe('computeDeadline', () => {
  it('works backwards from the expiry date', () => {
    const d = computeDeadline(settings, '2026-10-26')
    expect(d.filingOpens).toBe('2026-11-01')
    expect(d.filingCloses).toBe('2027-01-01')
    expect(d.latestExam).toBe('2026-12-04')
    expect(d.latestBooking).toBe('2026-11-13')
    expect(d.phase).toBe('prep')
    expect(d.french).toMatchObject({ booked: false, date: '2026-12-04', daysLeft: 39 })
  })
  it('moves through the phases', () => {
    expect(computeDeadline(settings, '2026-11-01').phase).toBe('filing')
    expect(computeDeadline(settings, '2027-01-01').phase).toBe('filing')
    expect(computeDeadline(settings, '2027-01-02').phase).toBe('late')
    expect(computeDeadline(settings, '2027-03-01').phase).toBe('expired')
  })
  it('flags a booked exam whose results would arrive too late', () => {
    const d = computeDeadline({ ...settings, frenchExam: '2026-12-15', civicExam: '2026-11-20' }, '2026-10-26')
    expect(d.french).toMatchObject({ booked: true, tooLate: true })
    expect(d.civic).toMatchObject({ booked: true, tooLate: false, daysLeft: 25 })
  })
})

describe('dailyNewQuota', () => {
  it('spreads unseen items over the days left, minus the buffer', () => {
    expect(dailyNewQuota(209, '2026-10-26', '2026-12-04')).toBe(6) // 209 / 36 days
  })
  it('keeps a minimum pace and never exceeds what is left', () => {
    expect(dailyNewQuota(52, '2026-10-26', '2026-12-04')).toBe(5)
    expect(dailyNewQuota(3, '2026-10-26', '2026-12-04')).toBe(3)
    expect(dailyNewQuota(0, '2026-10-26', '2026-12-04')).toBe(0)
  })
  it('asks for everything when the exam is (almost) here', () => {
    expect(dailyNewQuota(40, '2026-12-03', '2026-12-04')).toBe(40)
  })
})
