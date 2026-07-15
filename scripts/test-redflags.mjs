// Exercises the 5 red-flag rules against hand-crafted log fixtures.
// Run with:  node scripts/test-redflags.mjs
// Backed by jsdom-free plain Node — we stub the modules redFlags.js
// doesn't depend on at runtime by skipping the plan-data import path.

import {
  tendonPainFlag,
  ankleFlag,
  recoveryFlag,
  performanceFlag,
  weightFlag,
} from '../src/lib/redFlags.js'
import { addDays } from '../src/lib/dateUtils.js'

// jsdom-free stub so `Number.isFinite`/Date globals are usable in Node.
const PASS = '✅'
const FAIL = '❌'
let failed = 0
const expect = (cond, label) => {
  console.log(`${cond ? PASS : FAIL} ${label}`)
  if (!cond) failed += 1
}

// --- tendon_pain ------------------------------------------------------
{
  const logs = {
    '2026-07-10': { tendonPainNextAM: 2 },
    '2026-07-11': { tendonPainNextAM: 3 },
    '2026-07-12': { tendonPainNextAM: 4 },
  }
  // strictly increasing AND consecutive calendar days → true
  expect(tendonPainFlag(logs, '2026-07-12') === true, 'tendon: 3 consecutive increasing days fires')
}
{
  const logs = {
    '2026-07-08': { tendonPainNextAM: 2 },
    '2026-07-11': { tendonPainNextAM: 3 },
    '2026-07-12': { tendonPainNextAM: 4 },
  }
  // not consecutive (gap on 9th and 10th) → false
  expect(tendonPainFlag(logs, '2026-07-12') === false, 'tendon: gap breaks consecutive')
}
{
  // > 5 fires unconditionally
  expect(tendonPainFlag({ '2026-07-12': { tendonPainNextAM: 6 } }, '2026-07-12') === true, 'tendon: pain>5 fires')
}
{
  // decreasing trend → false
  const logs = { '2026-07-10': { tendonPainNextAM: 8 }, '2026-07-11': { tendonPainNextAM: 5 }, '2026-07-12': { tendonPainNextAM: 3 } }
  expect(tendonPainFlag(logs, '2026-07-12') === false, 'tendon: decreasing does NOT fire')
}

// --- ankle_flag -------------------------------------------------------
{
  expect(ankleFlag({ '2026-07-12': { ankleSwelling: true } }, '2026-07-12') === true, 'ankle: swelling')
  expect(ankleFlag({ '2026-07-12': { ankleGivingWay: true } }, '2026-07-12') === true, 'ankle: giving-way')
  expect(ankleFlag({ '2026-07-12': {} }, '2026-07-12') === false, 'ankle: empty log false')
  expect(ankleFlag({}, '2026-07-12') === false, 'ankle: missing day false')
}

// --- recovery_flag ----------------------------------------------------
// Build a baseline of HRV=60, RHR=50 over a trailing 7 days, then drop HRV
// to 45 (>= 25% drop = 25% of 60 = 15; 60*0.8=48 → 45 is below) and raise
// RHR to 56 (>= +5).
{
  const logs = {}
  const today = '2026-07-19'
  for (let off = 8; off >= 1; off--) {
    logs[addDays(today, -off)] = { hrv: 60, rhr: 50 }
  }
  // Two-day downward break starting yesterday
  logs[addDays(today, -1)] = { hrv: 45, rhr: 56 }
  logs[today] = { hrv: 45, rhr: 56 }
  expect(recoveryFlag(logs, today) === true, 'recovery: 2-day HRV↓ + RHR↑ fires')
}
{
  // Only one bad day → false (need today AND prior day)
  const logs = {}
  const today = '2026-07-19'
  for (let off = 8; off >= 1; off--) {
    logs[addDays(today, -off)] = { hrv: 60, rhr: 50 }
  }
  logs[addDays(today, -1)] = { hrv: 60, rhr: 50 }
  logs[today] = { hrv: 45, rhr: 56 }
  expect(recoveryFlag(logs, today) === false, 'recovery: single-day dip NOT enough')
}
// Note the spec framing: "today is compared to today's window, yesterday
// to yesterday's window." Tests cover that below explicitly.
{
  // Yesterday breaks the trailing-7 for ITS OWN window — make today's
  // HRV normal but yesterday's HRV low AND yesterday's avg includes the
  // bad day (so yesterday won't be low relative to its own baseline).
  // This confirms yesterday's baseline includes itself per the rule.
  const logs = {}
  const today = '2026-07-19'
  // Make today normal-feeling (high HRV, low RHR) over last 7 days.
  for (let off = 7; off >= 2; off--) {
    logs[addDays(today, -off)] = { hrv: 60, rhr: 50 }
  }
  logs[addDays(today, -1)] = { hrv: 55, rhr: 55 } // <-- 55 vs 60 = -8% → not flagged for yesterday
  logs[today] = { hrv: 45, rhr: 56 }                // vs 7-day avg 60 → 25% drop
  expect(recoveryFlag(logs, today) === false, 'recovery: per-day baseline respected')
}

// --- performance_flag -------------------------------------------------
{
  // True on today + 5 days ago inside the 7-day window → fires
  const logs = {
    '2026-07-12': { sessionFeltHarder: true },
    '2026-07-18': { sessionFeltHarder: true },
  }
  expect(performanceFlag(logs, '2026-07-18') === true, 'performance: 2/7 fires')
  // Only 1 → false
  expect(performanceFlag({ '2026-07-18': { sessionFeltHarder: true } }, '2026-07-18') === false, 'performance: 1/7 NOT enough')
  // 2 but one is outside the 7-day window → false
  const logs2 = {
    '2026-07-10': { sessionFeltHarder: true }, // 8 days ago
    '2026-07-18': { sessionFeltHarder: true },
  }
  expect(performanceFlag(logs2, '2026-07-18') === false, 'performance: outside window NOT counted')
}

// --- weight_flag ------------------------------------------------------
{
  // Window C (-20..-14) holds 86kg, Window B (-13..-7) holds 85kg,
  // Window A (-6..0) holds 84kg. Two consecutive >1% drops => true.
  // Strict offsets per window so no boundary-day drift between fixtures:
  //   C uses off 20,18,16 -> days 6-29, 7-1, 7-3
  //   B uses off 12,10,8  -> days 7-7, 7-9, 7-11
  //   A uses off 6,4,2,0  -> days 7-13, 7-15, 7-17, 7-19
  const logs = {}
  const today = '2026-07-19'
  for (const off of [20, 18, 16]) logs[addDays(today, -off)] = { bodyWeightKg: 86 }
  for (const off of [12, 10, 8]) logs[addDays(today, -off)] = { bodyWeightKg: 85 }
  for (const off of [6, 4, 2, 0]) logs[addDays(today, -off)] = { bodyWeightKg: 84 }
  expect(weightFlag(logs, today) === true, 'weight: two consecutive 1%+ drops fires')
}
{
  // Only one comparison available (no Window C). Recent vs prior drops,
  // but no second prior comparator => flag should NOT fire, per spec.
  const logs = {}
  const today = '2026-07-19'
  for (const off of [12, 10, 8]) logs[addDays(today, -off)] = { bodyWeightKg: 85 }
  for (const off of [6, 4, 2, 0]) logs[addDays(today, -off)] = { bodyWeightKg: 84 }
  expect(weightFlag(logs, today) === false, 'weight: one drop not enough')
}
{
  // No drop at all
  const logs = {}
  const today = '2026-07-19'
  for (let off = 21; off >= 0; off--) {
    if (off % 2 === 0) logs[addDays(today, -off)] = { bodyWeightKg: 84 }
  }
  expect(weightFlag(logs, today) === false, 'weight: stable weight NOT fired')
}

console.log(`\n${failed === 0 ? 'All red-flag tests passed.' : `${failed} test(s) failed.`}`)
process.exit(failed === 0 ? 0 : 1)
