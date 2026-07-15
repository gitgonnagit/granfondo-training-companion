// Red-flag evaluation engine.
//
// Spec §5: 5 rules, each takes (logs, date) and returns true/false.
// Where a rule needs more data than is logged yet, we simply don't
// fire that flag — never error, never guess.
//
// All helpers here are pure functions of `logs` + the arguments. The
// app evaluates them on the *currently selected* date for the Today
// tab, so the trend windows are bounded to "calendar days up to and
// including that date."

import { addDays, trailingDays } from './dateUtils.js'

// ---------- shared helpers ----------

function logsBeforeInclusive(logs, iso) {
  // Only days whose ISO <= `iso`. Plan-only dates are inherently bounded to
  // Wed-included weeks, but the caller may have logged ahead-of-plan dates
  // for testing, so we don't hard-filter by plan range here.
  const out = {}
  for (const k of Object.keys(logs)) {
    if (k <= iso) out[k] = logs[k]
  }
  return out
}

function numericEntries(logs, field, opts = {}) {
  const { from, to } = opts
  const out = []
  for (const k of Object.keys(logs)) {
    if (from && k < from) continue
    if (to && k > to) continue
    const v = logs[k]?.[field]
    if (typeof v === 'number' && Number.isFinite(v)) {
      out.push({ iso: k, value: v })
    }
  }
  out.sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0))
  return out
}

function avg(arr) {
  if (!arr.length) return null
  return arr.reduce((s, n) => s + n, 0) / arr.length
}

// ---------- rule 1: tendon_pain ----------
//
//   true if tendonPainNextAM > 5 on the selected date,
//   OR if the last 3 *consecutive calendar days* that have a logged
//   `tendonPainNextAM` value show a *strictly increasing* trend
//   (each later day > each earlier day, no ties equal).
//
// "Consecutive calendar days" = the 3 most recent dates with a value
// must be exactly d, d-1, d-2 with no gaps. We walk the trailing window
// until we land 3 logged values or hit a gap.
export function tendonPainFlag(logs, iso) {
  const dayLog = logs[iso]
  const todayPain = dayLog?.tendonPainNextAM
  if (typeof todayPain === 'number' && todayPain > 5) return true

  // Walk back day-by-day from `iso`, collecting logged values, stopping as
  // soon as we have 3 consecutive logged days or hit a 1-day gap.
  const collected = []
  for (let offset = 0; offset <= 14 && collected.length < 3; offset++) {
    const dayIso = addDays(iso, -offset)
    const v = logs[dayIso]?.tendonPainNextAM
    if (typeof v === 'number' && Number.isFinite(v)) {
      collected.push({ iso: dayIso, value: v })
    } else if (offset > 0) {
      // A gap before we hit three values breaks the "consecutive" chain.
      break
    }
  }
  if (collected.length < 3) return false
  const [a, b, c] = collected // walk-back order: a=newest, c=oldest
  // Strictly increasing toward today: c.value < b.value < a.value
  return c.value < b.value && b.value < a.value
}

// ---------- rule 2: ankle_flag ----------
//
//   true if `ankleSwelling` OR `ankleGivingWay` logged as true today.
export function ankleFlag(logs, iso) {
  const dayLog = logs[iso]
  if (!dayLog) return false
  return !!(dayLog.ankleSwelling || dayLog.ankleGivingWay)
}

// ---------- rule 3: recovery_flag ----------
//
//   true if, on the selected date AND the prior calendar day, both:
//     (a) HRV is >= 20% below the trailing 7-day average HRV (computed
//         from logged days only, minimum 3 data points required or skip
//         the check)
//     (b) RHR is >= 5 bpm above the trailing 7-day average RHR
//
// Per the spec's "20–25% below" / "5–7+ bpm above" range and its judgment
// note to lean toward SURFACING flags, we use the *lower bound* of each
// range. The recovery baseline is per-day and EXCLUDES the comparison
// day itself — otherwise today's bad reading would drag down its own
// baseline and mask the alarm. This matches the HRV4Training-style
// convention used by self-tracking athletes.
export function recoveryFlag(logs, iso) {
  const priorIso = addDays(iso, -1)

  // Today's baseline = calendar days 7-12..7-18 (yesterday inclusive, today excluded)
  // Yesterday's baseline = calendar days 7-11..7-17 (today excluded, day-before-yesterday inclusive)
  const hrv7today = numericEntries(logs, 'hrv', { to: addDays(iso, -1), from: addDays(iso, -7) })
  const rhr7today = numericEntries(logs, 'rhr', { to: addDays(iso, -1), from: addDays(iso, -7) })
  const hrv7prior = numericEntries(logs, 'hrv', { to: addDays(iso, -2), from: addDays(iso, -8) })
  const rhr7prior = numericEntries(logs, 'rhr', { to: addDays(iso, -2), from: addDays(iso, -8) })

  if (hrv7today.length < 3 || rhr7today.length < 3 || hrv7prior.length < 3 || rhr7prior.length < 3) {
    return false
  }

  const hrvAvgToday = avg(hrv7today.map((e) => e.value))
  const rhrAvgToday = avg(rhr7today.map((e) => e.value))
  const hrvAvgPrior = avg(hrv7prior.map((e) => e.value))
  const rhrAvgPrior = avg(rhr7prior.map((e) => e.value))

  const todayHrv = logs[iso]?.hrv
  const todayRhr = logs[iso]?.rhr
  const priorHrv = logs[priorIso]?.hrv
  const priorRhr = logs[priorIso]?.rhr

  if (
    !Number.isFinite(todayHrv) ||
    !Number.isFinite(priorHrv) ||
    !Number.isFinite(todayRhr) ||
    !Number.isFinite(priorRhr)
  ) {
    return false
  }

  const todayHrvDown = todayHrv <= hrvAvgToday * 0.8
  const priorHrvDown = priorHrv <= hrvAvgPrior * 0.8
  const todayRhrUp = todayRhr >= rhrAvgToday + 5
  const priorRhrUp = priorRhr >= rhrAvgPrior + 5

  return todayHrvDown && priorHrvDown && todayRhrUp && priorRhrUp
}

// ---------- rule 4: performance_flag ----------
//
//   true if `sessionFeltHarder` true on 2+ days within the trailing 7
//   calendar days (inclusive of selected date).
export function performanceFlag(logs, iso) {
  const window = trailingDays(iso, 7)
  let count = 0
  for (const d of window) {
    if (logs[d]?.sessionFeltHarder) count += 1
    if (count >= 2) return true
  }
  return false
}

// ---------- rule 5: weight_flag ----------
//
//   true if the average bodyWeightLbs over trailing 7 days is > 1% lower
//   than the average over the 7 days before that, sustained across TWO
//   CONSECUTIVE such weekly comparisons (i.e. the drop persisted into
//   a second week).
//
// We use 1% exactly (the lower bound of the spec's wording), again to
// lean toward surfacing the flag when in doubt.
export function weightFlag(logs, iso) {
  // Recent week: today + the previous 6 calendar days (window A)
  // Prior week:   days -7..-13 (window B)
  // The current comparison is: avg(A) vs avg(B). Drop must be > 1%.
  const recentWeek = numericEntries(logs, 'bodyWeightLbs', {
    to: iso,
    from: addDays(iso, -6),
  })
  const priorWeek = numericEntries(logs, 'bodyWeightLbs', {
    to: addDays(iso, -7),
    from: addDays(iso, -13),
  })
  // Each weekly comparison needs at least 2 data points to be meaningful.
  if (recentWeek.length < 2 || priorWeek.length < 2) return false

  const avgRecent = avg(recentWeek.map((e) => e.value))
  const avgPrior = avg(priorWeek.map((e) => e.value))
  if (avgRecent == null || avgPrior == null) return false

  // Drop > 1%
  if (avgRecent >= avgPrior * 0.99) return false

  // Now the *prior* weekly comparison: avg(B) vs avg(C), where C is the
  // 7-day window before B. Drop must ALSO be > 1% there. That's what
  // "sustained across two consecutive weekly comparisons" means.
  const priorPriorWeek = numericEntries(logs, 'bodyWeightLbs', {
    to: addDays(iso, -14),
    from: addDays(iso, -20),
  })
  if (priorPriorWeek.length < 2) {
    // We cannot see two consecutive comparisons without window C — do
    // NOT fire the flag, because we cannot confirm the drop has been
    // sustained. (Spec judgment: prefer surfacing flags, but only when
    // we have enough data to confirm the trend is sustained.)
    return false
  }
  const avgPriorPrior = avg(priorPriorWeek.map((e) => e.value))
  if (avgPriorPrior == null) return false
  return avgPrior < avgPriorPrior * 0.99
}

// ---------- aggregator ----------

import planData from '../data/planData.json' with { type: 'json' }

export function evaluateAllFlags(logs, iso) {
  return planData.redFlags
    .map((def) => {
      let triggered = false
      switch (def.id) {
        case 'tendon_pain':
          triggered = tendonPainFlag(logs, iso)
          break
        case 'ankle_flag':
          triggered = ankleFlag(logs, iso)
          break
        case 'recovery_flag':
          triggered = recoveryFlag(logs, iso)
          break
        case 'performance_flag':
          triggered = performanceFlag(logs, iso)
          break
        case 'weight_flag':
          triggered = weightFlag(logs, iso)
          break
      }
      return { ...def, triggered }
    })
    .filter((r) => r.triggered)
}

export { logsBeforeInclusive }
