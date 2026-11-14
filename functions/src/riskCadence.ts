import { istDate } from './riskCore'

export type RiskReviewCadence = 'daily' | 'weekly' | 'monthly'
/** An operator setting, never a college/client scan capability. Daily fits
 * the default 48-hour deadline-warning window; slower reviews are opt-in. */
export function riskReviewPolicy(value = process.env.ACADEMIC_RISK_REVIEW_CADENCE) {
  const cadence = (value || 'daily') as RiskReviewCadence
  if (!['daily', 'weekly', 'monthly'].includes(cadence)) throw new Error('ACADEMIC_RISK_REVIEW_CADENCE must be daily, weekly, or monthly')
  const schedule = cadence === 'daily' ? '0 3 * * *' : cadence === 'weekly' ? '0 3 * * 1' : '0 3 1 * *'
  return { cadence, schedule }
}

export function riskReviewPeriod(when: number, cadence: RiskReviewCadence): string {
  const localDate = istDate(when)
  if (cadence === 'monthly') return localDate.slice(0, 7) + '-01'
  if (cadence === 'daily') return localDate
  const date = new Date(localDate + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
  return date.toISOString().slice(0, 10)
}
