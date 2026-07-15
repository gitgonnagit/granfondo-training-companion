// Renders the day card: title, type badge, full prose, and an indoor
// target line OR the field-test checklist, depending on what's in the
// plan data. See build.md §4.1.

import React from 'react'
import planData from '../data/planData.json'
import {
  badgeClass,
  badgeLabel,
  indoorTargetLine,
  computeBpmRange,
} from '../lib/zoneCalc'

export default function WorkoutCard({ day, week, lthr, onJumpToSettings }) {
  const indoor = day.indoor
  const target = resolveTarget(indoor, lthr)

  return (
    <section
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden"
      aria-labelledby="workout-title"
    >
      <header className="flex items-start gap-2 flex-wrap px-4 pt-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${badgeClass(day.type)}`}
        >
          {badgeLabel(day.type)}
        </span>
        {week?.phase && (
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {week.phase}
          </span>
        )}
      </header>
      <h2 id="workout-title" className="px-4 pt-2 text-xl font-semibold text-slate-900">
        {day.title}
      </h2>

      {indoor && !indoor.isFieldTest && (
        <div className="mx-4 mt-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-3 py-2.5 text-sm text-emerald-900">
          {target.promptLthr ? (
            <button
              type="button"
              onClick={onJumpToSettings}
              className="tap w-full text-left font-medium underline decoration-emerald-400 decoration-2 underline-offset-4"
            >
              Enter your LTHR in Settings to see bpm targets. Tap to go there →
            </button>
          ) : (
            <p>
              <span className="font-semibold">
                Target: {target.min}–{target.max} bpm
              </span>
              <span className="text-emerald-700/80"> · {target.tail}</span>
            </p>
          )}
        </div>
      )}

      {indoor?.isFieldTest && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3 py-3 text-sm text-amber-900">
          <p className="font-semibold mb-1.5">LTHR Field Test Protocol</p>
          <ol className="list-decimal pl-5 space-y-1.5">
            {planData.fieldTestProtocol.map((step, i) => (
              <li key={i} className="pl-0.5">{step}</li>
            ))}
          </ol>
          <button
            type="button"
            onClick={onJumpToSettings}
            className="tap mt-3 w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            Done? Enter the resulting LTHR in Settings →
          </button>
        </div>
      )}

      <div className="px-4 py-4 text-[15px] leading-relaxed text-slate-700 whitespace-pre-line">
        {day.details}
      </div>
    </section>
  )
}

function resolveTarget(indoor, lthr) {
  if (!indoor || indoor.isFieldTest) {
    return { min: null, max: null, tail: '', promptLthr: false }
  }
  const range = indoor.zone ? computeBpmRange(indoor.zone, lthr) : null
  const line = indoorTargetLine(indoor, lthr)
  // The full target line starts with "Target: 173–180 bpm ("... then a
  // long descriptive tail. We surface the bpm range prominently and keep
  // the rest as the green-tinted tail.
  const tail = line.replace(/^Target:.*?\)\s*·\s*/, '')
  if (!lthr && indoor.zone) {
    return { min: null, max: null, tail, promptLthr: true }
  }
  return {
    min: range?.min ?? null,
    max: range?.max ?? null,
    tail,
    promptLthr: false,
  }
}
