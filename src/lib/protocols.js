// Structured exercise protocols for every gym day in the plan.
//
// The plan-data.json's `details` field contains prose shorthand like
// "same as Week 1, +1 set on each exercise" and "reduce volume ~30%
// vs. Week 3". This module unlocks those shorthand references into
// explicit, day-by-day exercise lists so the athlete never has to
// swipe back to a reference week to see what the day actually
// prescribes.
//
// Where the plan prose is incomplete (e.g., Week 4 Wed says
// "reduce volume ~30% vs. Week 3"; Week 7 Wed says "light session.
// Continue jump-land work if cleared"; Week 8 Wed says "mobility
// focus"), we derive an explicit interpretation from the immediately
// prior week + the prose delta. Each derivation is documented as an
// `assumption` note on the entry. The athlete can trust these lines or
// discard them — the prose from plan-data.json remains visible below.
//
// Schema:
//   PROTOCOLS_BY_DATE: { 'YYYY-MM-DD': { upper?, lower? } }
//   upper/lower: Array<{ name, work, note? }>
//     name: human-readable exercise name
//     work: e.g. "3×8" or "3×45s" — sets × reps or seconds/etc.
//     note: optional free-form annotation ("(if shoulder pain-free)",
//           "(eyes closed)", "(added load vs. Week 2)", etc.)

export function getUpperBody(isoDate) {
  return PROTOCOLS_BY_DATE[isoDate]?.upper ?? null
}

export function getLowerBody(isoDate) {
  return PROTOCOLS_BY_DATE[isoDate]?.lower ?? null
}

export const PROTOCOLS_BY_DATE = {
  // ============================================================
  // WEEKS 1-4 use lthrPeriod='lthr1' — LTHR1 from Week 1's field test
  // WEEKS 5-8 use lthrPeriod='lthr2' — LTHR2 from Week 5's retest
  // Race Week has no gym days
  // ============================================================

  // -------------------- Week 1 --------------------
  // LTHR field test day (Part 1) + upper-body primer (Part 2)
  '2026-07-15': {
    upper: [
      { name: 'Band ER / IR',            work: '3×15' },
      { name: 'Face pulls',              work: '3×12' },
      { name: 'OH press (light)',        work: '3×8' },
      { name: 'Landmine press',          work: '3×8' },
      { name: 'Dead bug + side plank',   work: '3 of each' },
      { name: 'Ankle proprioception',    work: '10 min', note: 'after the lifts' },
    ],
  },
  '2026-07-19': {
    lower: [
      { name: 'WU + mobility',           work: '5 min' },
      { name: 'Leg press or Spanish squat', work: '4×8 @ RPE 6', note: 'depth 60–70° flexion, 3s down / 2s up' },
      { name: 'Split squat',             work: '3×8 / side' },
      { name: 'RDL',                     work: '3×8' },
      { name: 'Calf raise',              work: '4×12' },
      { name: 'Band ankle inv / ev',     work: '3×15 / side' },
      { name: 'Single-leg balance',      work: '3×30s / side' },
      { name: 'Pallof press',            work: '3×10 / side' },
      { note: 'If legs are trashed from yesterday\'s ride, cut load ~20% rather than skipping.' },
    ],
  },

  // -------------------- Week 2 --------------------
  // "same as Week 1, +1 set on each exercise"
  '2026-07-22': {
    upper: [
      { name: 'Band ER / IR',            work: '4×15', note: '+1 set vs. Week 1' },
      { name: 'Face pulls',              work: '4×12', note: '+1 set vs. Week 1' },
      { name: 'OH press (light)',        work: '4×8',  note: '+1 set vs. Week 1' },
      { name: 'Landmine press',          work: '4×8',  note: '+1 set vs. Week 1' },
      { name: 'Dead bug + side plank',   work: '4 of each', note: '+1 set vs. Week 1' },
      { name: 'Ankle proprioception',    work: '10 min' },
    ],
  },
  '2026-07-26': {
    lower: [
      { name: 'WU + mobility',           work: '5 min' },
      { name: 'Leg press / Spanish squat', work: '4×8', note: 'progress depth 80–90° and +5–10% load IF next-day pain returned to baseline all week' },
      { name: 'Split squat',             work: '3×10 / side' },
      { name: 'RDL',                     work: '3×10' },
      { name: 'Single-leg calf raise',   work: '4×12' },
      { name: 'Band ankle work',         work: '3×15 / side' },
      { name: 'Single-leg balance, eyes closed', work: '3×30s' },
      { name: 'Pallof press',            work: '3×12 / side' },
    ],
  },

  // -------------------- Week 3 --------------------
  // "add load to landmine press" — keep Week 2's sets, bump load on landmine
  '2026-07-29': {
    upper: [
      { name: 'Band ER / IR',            work: '4×15' },
      { name: 'Face pulls',              work: '4×12' },
      { name: 'OH press (light)',        work: '4×8' },
      { name: 'Landmine press',          work: '4×8', note: 'load increased vs. Week 2' },
      { name: 'Dead bug + side plank',   work: '4 of each' },
      { name: 'Ankle proprioception',    work: '10 min' },
    ],
  },
  '2026-08-02': {
    lower: [
      { name: 'WU + mobility',           work: '5 min' },
      { name: 'Leg press',               work: '4×8', note: 'heavier than Week 2' },
      { name: 'Split squat',             work: '3×10' },
      { name: 'RDL',                     work: '3×10' },
      { name: 'Single-leg calf raise',   work: '4×15' },
      { name: 'Pogo hops (low amplitude)', work: '2×10', note: 'ONLY if pain ≤3/10 during activity AND resolved by next morning for 10+ straight days — otherwise skip' },
      { note: 'Yesterday was a 2:30 ride + surges — autoregulate load down if legs are cooked.' },
    ],
  },

  // -------------------- Week 4 — DELOAD --------------------
  // "reduce volume ~30% vs. Week 3" — drop one set on each exercise
  '2026-08-05': {
    upper: [
      { name: 'Band ER / IR',            work: '3×15', note: '−1 set vs. Week 3 (DELOAD)' },
      { name: 'Face pulls',              work: '3×12', note: '−1 set vs. Week 3 (DELOAD)' },
      { name: 'OH press (light)',        work: '3×8',  note: '−1 set vs. Week 3 (DELOAD)' },
      { name: 'Landmine press',          work: '3×8',  note: '−1 set vs. Week 3 (DELOAD)' },
      { name: 'Dead bug + side plank',   work: '3 of each', note: '−1 set vs. Week 3 (DELOAD)' },
    ],
  },
  '2026-08-09': {
    lower: [
      { name: 'WU + mobility',           work: '5 min' },
      { name: 'Spanish squat holds (isometric)', work: '5×45s', note: 'primary movement — DELOAD' },
      { name: 'Light balance work',      work: '~10 min' },
      { note: 'CHECK-IN: review pain trend, HRV trend, ankle status before advancing to Week 5 — do not progress if any are still flagged.' },
    ],
  },

  // -------------------- Week 5 --------------------
  // LTHR retest + upper body: add medicine-ball chest pass
  '2026-08-12': {
    upper: [
      { name: 'Band ER / IR',            work: '3×15' },
      { name: 'Face pulls',              work: '3×12' },
      { name: 'OH press (light)',        work: '3×8' },
      { name: 'Landmine press',          work: '3×8' },
      { name: 'Dead bug + side plank',   work: '3 of each' },
      { name: 'Medicine-ball chest pass (light)', work: '2×8', note: 'only if shoulder is pain-free' },
      { name: 'Ankle proprioception',    work: '10 min' },
    ],
  },
  '2026-08-16': {
    lower: [
      { name: 'WU + mobility',           work: '5 min' },
      { name: 'Leg press / Spanish squat', work: '4×8–10', note: 'heavier than Week 3 — progressive loading resumed' },
      { name: 'Split squat',             work: '3×10' },
      { name: 'RDL',                     work: '3×10' },
      { name: 'Single-leg calf raise',   work: '4×15' },
      { name: 'Hop-to-stick',            work: '2×8', note: 'only if ankle / tendon criteria are met' },
      { note: 'Yesterday was a 3:00 long ride — reduce today\'s load if legs are flat.' },
    ],
  },

  // -------------------- Week 6 — PEAK --------------------
  // "jump-land mechanics drill if cleared" — keep Week 5 base + add jump-land
  '2026-08-19': {
    upper: [
      { name: 'Band ER / IR',            work: '3×15' },
      { name: 'Face pulls',              work: '3×12' },
      { name: 'OH press (light)',        work: '3×8' },
      { name: 'Landmine press',          work: '3×8' },
      { name: 'Dead bug + side plank',   work: '3 of each' },
      { name: 'Medicine-ball chest pass (light)', work: '2×8', note: 'only if shoulder is pain-free' },
      { name: 'Jump-land step-offs',     work: '2×8', note: 'low box step-offs, soft-landing focus — only if cleared' },
    ],
  },
  '2026-08-23': {
    lower: [
      { name: 'WU + mobility',           work: '5 min' },
      { name: 'Leg press / Spanish squat', work: 'Peak loads', note: 'reduce 20–30% or shift to isometric-only if quads / tendons are flagging from yesterday\'s 3:45–4:00 ride' },
      { name: 'Split squat',             work: 'Peak loads' },
      { name: 'RDL',                     work: 'Peak loads' },
      { name: 'Single-leg calf raise',   work: 'At peak volume' },
      { name: 'Lateral bounds',          work: '2×8 / side', note: 'only if volleyball-cleared' },
    ],
  },

  // -------------------- Week 7 — TAPER BEGINS --------------------
  // "light session. Continue jump-land work if cleared" — trimmed volume
  '2026-08-26': {
    upper: [
      { name: 'Band ER / IR',            work: '2×15', note: 'light session' },
      { name: 'Face pulls',              work: '2×12', note: 'light session' },
      { name: 'OH press (light)',        work: '2×8',  note: 'light session' },
      { name: 'Landmine press',          work: '2×8',  note: 'light session' },
      { name: 'Dead bug + side plank',   work: '2 of each', note: 'light session' },
      { name: 'Jump-land step-offs',     work: '2×8', note: 'continuing from Week 6 — only if cleared' },
    ],
  },
  '2026-08-30': {
    lower: [
      { name: 'WU + mobility',           work: '5 min' },
      { name: 'Leg press / Spanish squat', work: 'Keep load, ↓ volume ~35%', note: 'sharpen quality, not fatigue' },
      { name: 'Split squat',             work: 'Keep load, ↓ volume' },
      { name: 'RDL',                     work: 'Keep load, ↓ volume' },
      { name: 'Single-leg calf raise',   work: 'Keep load, ↓ volume' },
    ],
  },

  // -------------------- Week 8 — TAPER --------------------
  // "Light Upper/Core: mobility focus" — only mobility + lightest bands
  '2026-09-02': {
    upper: [
      { name: 'T-spine rotations (mobility)', work: '2×8 / side' },
      { name: 'Scapular CARs',           work: '2×10' },
      { name: 'Banded pull-aparts (light)', work: '2×15' },
      { name: 'Ankle ROM',               work: '5 min' },
      { note: 'Mobility only — no loaded pressing this week.' },
    ],
  },
  '2026-09-06': {
    lower: [
      { name: 'WU + mobility',           work: '5 min' },
      { name: 'Spanish squat holds',      work: '3×30s', note: 'light' },
      { name: 'Calf raise',              work: '2×15', note: 'light' },
      { name: 'Single-leg balance',      work: '2×20s / side', note: 'movement quality focus' },
      { note: 'Reduced loads. Start easing carbs upward toward evening for race-week prep.' },
    ],
  },
}
