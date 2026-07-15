// Date utilities. All dates are modeled as YYYY-MM-DD (no time component)
// to avoid TZ drift between device-clock and the trainng plan's calendar.
//
// We also expose helpers for the "trailing N calendar days" queries the
// red-flag rules need (build.md §5).

import planData from '../data/planData.json' with { type: 'json' }

export const RACE_DATE = planData.athlete.raceDate
export const PLAN_START = planData.weeks[0].days[0].date
export const PLAN_END = RACE_DATE

export function todayISO() {
  const d = new Date()
  return formatISO(d)
}

export function formatISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISO(iso) {
  // Parse as a *local* calendar date — "2026-07-13" becomes a Date for the
  // local midnight on that day, avoiding the UTC off-by-one some browsers
  // produce when you use `new Date("2026-07-13")`.
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return formatISO(d)
}

export function isInPlan(iso) {
  return iso >= PLAN_START && iso <= PLAN_END
}

// Find the day object in the plan matching `iso`, or null.
export function findDay(iso) {
  for (const week of planData.weeks) {
    for (const day of week.days) {
      if (day.date === iso) {
        return { day, week }
      }
    }
  }
  return null
}

// Index of the week containing `iso` in `planData.weeks` (0..8), or
// -1 if `iso` doesn't fall on any plan day. Week 0 is "week1", week 7
// is "week8", week 8 is "raceweek".
export function getCurrentWeekIndex(iso) {
  return planData.weeks.findIndex((w) => w.days.some((d) => d.date === iso))
}

// Default selected date on first load: the device's today, only if it
// falls inside the plan window; otherwise the plan start.
export function defaultSelectedDate() {
  const t = todayISO()
  return isInPlan(t) ? t : PLAN_START
}

export function daysUntilTarget(targetIso, fromIso = null) {
  const a = parseISO(fromIso || todayISO())
  const b = parseISO(targetIso)
  const ms = b.getTime() - a.getTime()
  return Math.round(ms / 86400000)
}

export function prettyDate(iso) {
  const d = parseISO(iso)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function prettyDateLong(iso) {
  const d = parseISO(iso)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// "Last N calendar days before the selected date (inclusive)", returned
// as an array of `iso` strings in ascending order, using *every* calendar
// day, skipping only days with no log entry the caller asked to filter.
// The caller decides what makes a day "have data" for their query.
export function trailingDays(endIso, n) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    out.push(addDays(endIso, -i))
  }
  return out
}
