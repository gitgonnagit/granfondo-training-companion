// Renders the day card: title, type badge, indoor target line (always —
// with bpm if LTHR available, % form otherwise), the field-test protocol
// (field-test days only), the structured exercise list (when present in
// protocols.js for that date), and the day details prose.

import React from 'react'
import planData from '../data/planData.json' with { type: 'json' }
import {
  badgeClass,
  badgeLabel,
  indoorTargetLine,
} from '../lib/zoneCalc.js'
import { getUpperBody, getLowerBody } from '../lib/protocols.js'

export default function WorkoutCard({ day, week, lthr, onJumpToSettings }) {
  const target = indoorTargetLine(day.indoor, lthr)
  const upper = day.indoor ? getUpperBody(day.date) : null
  const lower = day.type === 'golf_gym_lower' ? getLowerBody(day.date) : null
  const showProtocolList = !!(upper || lower)

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

      {/* Indoor target line — always shown, with the LTHR-derived or %-form head */}
      {day.indoor && !day.indoor.isFieldTest && (
        <div className="mx-4 mt-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-3 py-2.5 text-sm text-emerald-900">
          <p>
            <span className="font-semibold">{target.head}</span>
            {target.tail && <span className="text-emerald-700/80"> · {target.tail}</span>}
          </p>
          {!target.hasLthr && target.hasZone && (
            <p className="mt-1.5 text-[12px]">
              <button
                type="button"
                onClick={onJumpToSettings}
                className="font-medium underline decoration-emerald-400 decoration-2 underline-offset-4 hover:decoration-emerald-600"
              >
                Enter your LTHR in Settings →
              </button>
              <span className="text-emerald-700/70"> to see bpm range.</span>
            </p>
          )}
        </div>
      )}

      {/* Field-test protocol (Week 1 Wed, Week 5 Wed) */}
      {day.indoor?.isFieldTest && (
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

      {/* Structured exercise protocol — replaces the "same as Week N" shorthand */}
      {showProtocolList && (
        <ProtocolList upper={upper} lower={lower} dayType={day.type} />
      )}

      {/* Original prose from plan-data.json — kept for color/context */}
      <div className="px-4 py-4 text-[15px] leading-relaxed text-slate-700 whitespace-pre-line">
        {day.details}
      </div>
    </section>
  )
}

function ProtocolList({ upper, lower, dayType }) {
  const items = upper || lower
  const sectionTitle = upper
    ? 'Part 2 — Upper Body / Core Protocol'
    : 'Lower-Body Strength Protocol'
  return (
    <div
      className="mx-4 mt-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-3"
      data-testid="protocol-list"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-2">
        {sectionTitle}{' '}
        {upper
          ? '· (Wed gym day)'
          : '· (Sun golf + gym day)'}
      </p>
      <ol className="space-y-1.5 text-[14px] text-slate-800 list-decimal pl-5 marker:text-slate-400">
        {items.map((ex, i) => (
          <li key={i} className={ex.name ? '' : 'list-none'}>
            {ex.name ? (
              <span>
                <span className="font-semibold">{ex.name}</span>
                <span className="text-slate-600"> — {ex.work}</span>
                {ex.note && <span className="text-slate-500 italic"> ({ex.note})</span>}
              </span>
            ) : (
              <span className="text-slate-500 italic">{ex.note}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
