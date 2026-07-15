// LTHR-to-BPM zone lookup. The plan file declares HR zones as
// `% of LTHR` ranges — at runtime we multiply the athlete's entered
// LTHR by those percentages and round to an integer BPM.

import planData from '../data/planData.json' with { type: 'json' }

export function getHrZone(zoneId) {
  return planData.hrZones.find((z) => z.id === zoneId) || null
}

export function getPowerZone(zoneId) {
  return planData.powerZones.find((z) => z.id === zoneId) || null
}

// Return a {min, max, lthrPctMin, lthrPctMax} object with rounded BPM
// values derived from the current LTHR.
// Returns null when either the zone is missing or there's no LTHR
// (so callers can detect "we haven't measured LTHR yet").
export function computeBpmRange(zoneId, lthr) {
  const z = getHrZone(zoneId)
  if (!z || !lthr) return null
  const min = Math.round((z.pctLTHRmin / 100) * lthr)
  const max = Math.round((z.pctLTHRmax / 100) * lthr)
  return { min, max, lthrPctMin: z.pctLTHRmin, lthrPctMax: z.pctLTHRmax }
}

// Compose the full target-line shown on an indoor session card.
//
// Per build.md §4.1: when LTHR is not yet entered, the %/RPE/cadence
// info STILL APPEARS — only the bpm number is replaced with the %
// range and a "see Settings" prompt is added. We split the head from
// the tail so callers can style them differently.
//   With LTHR:    "Target: 173–180 bpm (Zone 4, 95–99% of LTHR 182) · RPE · Cadence · …"
//   Without LTHR: "Target: 95–99% LTHR · RPE · Cadence · …"
//
// Returns an object: { head: string, tail: string, hasZone: bool, hasLthr: bool }
// — never a single string with brittle regex delimiters.
export function indoorTargetLine(indoor, lthr) {
  if (!indoor) return { head: '', tail: '', hasZone: false, hasLthr: false }
  if (indoor.isFieldTest) {
    // Field-test days render their own amber protocol box in WorkoutCard;
    // no caller reads `target.head` for field-test days so we return blanks.
    return { head: '', tail: '', hasZone: false, hasLthr: false }
  }
  const z = indoor.zone ? getHrZone(indoor.zone) : null
  const tailBits = []
  if (z) {
    tailBits.push(`RPE ${z.rpe}`)
    tailBits.push(`Cadence ${z.cadence}`)
  }
  if (indoor.intervals) tailBits.push(indoor.intervals)
  if (indoor.recovery) tailBits.push(indoor.recovery)
  const tail = tailBits.join(' · ')

  if (!z) return { head: tail, tail: '', hasZone: false, hasLthr: !!lthr }

  if (lthr) {
    const range = computeBpmRange(indoor.zone, lthr)
    return {
      head: `Target: ${range.min}–${range.max} bpm (${z.label}, ${range.lthrPctMin}–${range.lthrPctMax}% of LTHR ${lthr})`,
      tail,
      hasZone: true,
      hasLthr: true,
    }
  }
  return {
    head: `Target: ${z.pctLTHRmin}–${z.pctLTHRmax}% LTHR`,
    tail,
    hasZone: true,
    hasLthr: false,
  }
}

// True if LTHR has been entered for the period that week uses.
// Spec: weeks 1–4 use lthr1, weeks 5–8 use lthr2, race week has no indoor.
export function lthrForWeek(week, settings) {
  if (!week?.lthrPeriod) return null
  return settings[week.lthrPeriod] ?? null
}

// Color treatment for day-type badges (spec §7).
export function badgeClass(type) {
  switch (type) {
    case 'outdoor_hills':
    case 'outdoor_long':
      return 'bg-sky-100 text-sky-800 ring-sky-300'
    case 'gym_combined':
    case 'golf_gym_lower':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-300'
    case 'rest':
    case 'recovery':
      return 'bg-slate-100 text-slate-700 ring-slate-300'
    case 'race':
      return 'bg-amber-100 text-amber-900 ring-amber-300'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-300'
  }
}

export function badgeLabel(type) {
  switch (type) {
    case 'outdoor_hills':
      return 'Outdoor · Hills'
    case 'outdoor_long':
      return 'Outdoor · Long'
    case 'gym_combined':
      return 'Gym · Bike + Strength'
    case 'golf_gym_lower':
      return 'Golf + Gym'
    case 'rest':
      return 'Rest'
    case 'recovery':
      return 'Recovery'
    case 'race':
      return '★ Race Day'
    default:
      return type
  }
}
