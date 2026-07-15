// "Recent flags (7 days)" widget for the Today tab. Aggregates red
// flags fired across the 7 calendar days ending at the device's actual
// today (NOT the navigated `selectedDate`) — the user said "at-a-
// glance each morning", so the summary always represents the recent
// state regardless of where the user is looking in the calendar.
//
// Empty state: green-bordered "All clear" pill.
// Populated state: amber-bordered pill with the unique fired rules,
// each followed by the number of days that rule fired
// (e.g. "⚑ Tendon ×3 · ⚑ Ankle ×1").

import React, { useMemo } from 'react'
import { addDays, todayISO } from '../lib/dateUtils.js'
import { evaluateAllFlags } from '../lib/redFlags.js'
import FlagBadge from './FlagBadge.jsx'

const WINDOW_DAYS = 7

export default function RecentFlagsWidget({ logs }) {
  // Anchor to actual today (not selectedDate) so the morning summary
  // is stable regardless of where the user navigated. Spec wording:
  // "at-a-glance each morning".
  const today = todayISO()

  const summary = useMemo(() => {
    // flagId → number of distinct days that rule fired across the window.
    // Walks oldest → newest so insertion order = chronological order;
    // combined with how `evaluateAllFlags` iterates `planData.redFlags`,
    // this gives us a stable per-rule ordering that matches the spec's
    // tendon → ankle → recovery → performance → weight rule order.
    const counts = new Map()
    let total = 0
    for (let offset = WINDOW_DAYS - 1; offset >= 0; offset--) {
      const iso = addDays(today, -offset)
      if (!logs[iso]) continue
      const flags = evaluateAllFlags(logs, iso)
      for (const f of flags) {
        counts.set(f.id, (counts.get(f.id) || 0) + 1)
        total += 1
      }
    }
    return { counts, total }
  }, [logs, today])

  if (summary.total === 0) {
    return (
      <section
        aria-label="Recent flags, last 7 days"
        className="rounded-2xl bg-white ring-1 ring-emerald-200 shadow-sm px-4 py-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Recent flags · 7 days
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-emerald-700">
              All clear — no red flags in the last 7 days
            </p>
          </div>
          <span aria-hidden="true" className="text-[24px] text-emerald-600">✓</span>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label={`Recent flags, last 7 days — ${summary.total} fired`}
      className="rounded-2xl bg-white ring-1 ring-amber-300 shadow-sm px-4 py-3"
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          Recent flags · 7 days
        </p>
        <p className="text-[13px] font-semibold text-amber-900">
          {summary.total} flag{summary.total === 1 ? '' : 's'} in 7 days
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
        {Array.from(summary.counts.entries()).map(([id, n]) => (
          <span
            key={id}
            className="inline-flex items-center gap-1.5"
            title={`Fired ${n} of last 7 days`}
          >
            <FlagBadge id={id} />
            <span
              aria-hidden="true"
              className="text-[11px] font-semibold text-slate-600 tabular-nums"
            >
              × {n}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
