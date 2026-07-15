// Today tab — header + day navigator + workout card + nutrition card +
// red flag banner(s) + log form.
//
// State held here: selectedDate (ISO). Reads logs+settings parent props.

import React, { useEffect, useMemo, useState } from 'react'
import {
  addDays,
  defaultSelectedDate,
  findDay,
  isInPlan,
  prettyDate,
  prettyDateLong,
  RACE_DATE,
  daysUntilTarget,
  PLAN_END,
  PLAN_START,
} from '../lib/dateUtils.js'
import WorkoutCard from './WorkoutCard.jsx'
import NutritionCard from './NutritionCard.jsx'
import RedFlagBanner from './RedFlagBanner.jsx'
import LogForm from './LogForm.jsx'
import { evaluateAllFlags } from '../lib/redFlags.js'
import { lthrForWeek } from '../lib/zoneCalc.js'

export default function TodayView({ logs, settings, selectedDate, onSelectDate, onJumpToSettings, onSetLog }) {
  const inPlan = isInPlan(selectedDate)
  const dayPair = inPlan ? findDay(selectedDate) : null
  const flags = useMemo(() => evaluateAllFlags(logs, selectedDate), [logs, selectedDate])

  // Debounced save indicator: "Saving..." → "Saved ✓"
  const [saveStatus, setSaveStatus] = useState(null)
  // Tie the indicator to log changes from this view; parent owns persistence.
  useEffect(() => {
    setSaveStatus('saved')
    const t = setTimeout(() => setSaveStatus(null), 1500)
    return () => clearTimeout(t)
  }, [logs])

  if (!inPlan) {
    return (
      <div className="px-4 py-6">
        <Header
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          week={null}
        />
        <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-6 text-center">
          <p className="text-base font-semibold text-slate-800">
            Outside the training plan window
          </p>
          <p className="mt-1 text-sm text-slate-600">
            The plan runs from <span className="font-medium">{prettyDateLong(PLAN_START)}</span> through{' '}
            <span className="font-medium">{prettyDateLong(PLAN_END)}</span>.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Use the navigator above to step into a day, or open Settings to reset data.
          </p>
        </div>
      </div>
    )
  }

  const day = dayPair.day
  const week = dayPair.week
  const lthr = lthrForWeek(week, settings)

  return (
    <div className="px-4 py-5 space-y-4">
      <Header
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        week={week}
      />

      {flags.length > 0 && (
        <div className="space-y-2">
          {flags.map((f) => <RedFlagBanner key={f.id} flag={f} />)}
        </div>
      )}

      <WorkoutCard
        day={day}
        week={week}
        lthr={lthr}
        onJumpToSettings={onJumpToSettings}
      />

      <NutritionCard />

      <LogForm
        key={selectedDate}
        iso={selectedDate}
        dayType={day.type}
        initial={logs[selectedDate]}
        onChange={(entry) => onSetLog(selectedDate, entry)}
        saveStatus={saveStatus}
      />
    </div>
  )
}

function Header({ selectedDate, onSelectDate, week }) {
  const prevDay = useMemo(() => addDays(selectedDate, -1), [selectedDate])
  const nextDay = useMemo(() => addDays(selectedDate, 1), [selectedDate])
  const countdown = daysUntilTarget(RACE_DATE, selectedDate)

  return (
    <header className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white px-4 py-4 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectDate(prevDay)}
          className="tap inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium hover:bg-white/20"
          aria-label="Previous day"
        >
          <span aria-hidden>‹</span> Prev
        </button>
        <div className="text-center min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-sky-200/80">
            {week ? `${week.title} · ${week.phase}` : 'Today'}
          </p>
          <p className="text-base font-semibold">{prettyDate(selectedDate)}</p>
          <p className="text-[11px] text-sky-200/80 mt-0.5">
            {countdown > 0
              ? `${countdown} day${countdown === 1 ? '' : 's'} to race`
              : countdown === 0
                ? 'Race day!'
                : `${Math.abs(countdown)} day${Math.abs(countdown) === 1 ? '' : 's'} post-race`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectDate(nextDay)}
          className="tap inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium hover:bg-white/20"
          aria-label="Next day"
        >
          Next <span aria-hidden>›</span>
        </button>
      </div>
    </header>
  )
}
