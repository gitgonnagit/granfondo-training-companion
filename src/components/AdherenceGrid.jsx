// Plan-vs-actual adherence grid for the current week (7 cells in a row).
// Each cell = one planned day with a completion/missed/future indicator
// derived purely from `logs[day.date].completed` — no schema change.
//
// Anchored to the device's actual today (NOT `selectedDate`) for the
// same "at-a-glance each morning" reason as RecentFlagsWidget: the
// widget stays stable when the user navigates the calendar.
//
// Tap behavior mirrors WeekProgress: tapping a cell jumps to that day
// in Today. Hover/tap detail (session title + last-edit timestamp) is
// conveyed via native `title=` for desktop hover AND aria-label for SR.

import React, { useMemo } from 'react'
import { todayISO } from '../lib/dateUtils.js'

// Per-cell visual states. `today` cell always picks `today-*` regardless
// of log presence so it stands out; the inner glyph flips between ✓
// (logged + completed) and ● (either no log or logged + open).
function cellState(day, log, today) {
  if (day.date > today) return { tone: 'future', glyph: '·', label: 'upcoming' }
  if (day.date === today) {
    return log?.completed
      ? { tone: 'today', glyph: '✓', label: 'today, completed' }
      : { tone: 'today', glyph: '●', label: log ? 'today, log open' : 'today, no log yet' }
  }
  if (log?.completed) return { tone: 'completed', glyph: '✓', label: 'completed' }
  if (log) return { tone: 'partial', glyph: '○', label: 'logged but not completed' }
  return { tone: 'missed', glyph: '✕', label: 'no log' }
}

const TONE_CLASS = {
  future:    'bg-white text-slate-400 ring-1 ring-slate-200',
  today:     'bg-sky-50  text-sky-900   ring-2 ring-sky-500 font-bold',
  completed: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  partial:   'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
  missed:    'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
}

function relativeTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const ms = Date.now() - d.getTime()
  if (ms < 60_000) return 'just now'
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} hr ago`
  const days = Math.floor(ms / 86_400_000)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function AdherenceGrid({ logs, week, onSelectDate }) {
  const today = todayISO()

  const summary = useMemo(() => {
    let completed = 0
    let past = 0
    for (const day of week.days) {
      if (day.date > today) continue
      past += 1
      if (logs[day.date]?.completed) completed += 1
    }
    return { completed, past }
  }, [logs, week, today])

  return (
    <section
      aria-label={`Adherence for ${week.title}`}
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 px-3 pt-3 pb-2.5"
    >
      <div className="flex items-baseline justify-between gap-2 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Adherence · {week.title}
        </p>
        <p className="text-[12px] font-medium text-slate-600">
          {summary.past === 0 ? (
            <span className="text-slate-500">no past days yet</span>
          ) : (
            <>
              <span className="tabular-nums font-semibold text-slate-800">{summary.completed}</span>
              <span aria-hidden="true"> / </span>
              <span className="tabular-nums">{summary.past}</span>
              <span className="ml-1">completed</span>
            </>
          )}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {week.days.map((day) => {
          const log = logs[day.date]
          const state = cellState(day, log, today)
          const isToday = day.date === today
          const when = relativeTime(log?.updatedAt)
          const fullTitle = `${day.day} ${prettyShort(day.date)} — ${day.title}`
          const detail = `, ${state.label}${when ? `, last edit ${when}` : ''}`
          const aria = fullTitle + (state.tone === 'future' ? ', upcoming' : detail)
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              aria-current={isToday ? 'true' : undefined}
              aria-label={aria}
              title={fullTitle}
              className={`min-h-[44px] rounded-lg px-1 py-1 flex flex-col items-center justify-center text-center transition active:scale-95 ${TONE_CLASS[state.tone]} ${
                state.tone === 'future' ? 'opacity-60 hover:opacity-100' : 'hover:brightness-95'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                {day.day.slice(0, 2)}
              </span>
              <span className="text-[12px] font-bold tabular-nums leading-none mt-0.5">
                {day.date.slice(8, 10)}
              </span>
              <span aria-hidden="true" className="text-[12px] leading-none mt-0.5">
                {state.glyph}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function prettyShort(iso) {
  // "Jul 15" — half the locale space, used for hover tooltip
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
