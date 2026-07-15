// Standing nutrition reference card. The plan data ships a single
// `nutrition` array of bullets that applies every day (build.md §4.1)
// so this card renders the same content for all dates.

import React from 'react'
import planData from '../data/planData.json' with { type: 'json' }

export default function NutritionCard() {
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <header className="px-4 pt-4 flex items-center gap-2">
        <h2 className="text-base font-semibold text-slate-900">Nutrition Reference</h2>
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-300">
          Standing
        </span>
      </header>
      <ul className="px-4 py-3 space-y-2 text-[15px] leading-relaxed text-slate-700">
        {planData.nutrition.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 inline-block h-1.5 w-1.5 flex-none rounded-full bg-amber-500" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
