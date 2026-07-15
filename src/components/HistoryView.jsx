// History tab. Reverse-chronological list of dates that have ANY logged
// data; tap a row to jump back to the Today tab pre-loaded with that
// date. Includes a tiny inline-SVG sparkline of HRV + next-AM pain
// trends (spec §10 stretch goal, kept minimal).

import React, { useMemo } from 'react'
import { findDay, prettyDate } from '../lib/dateUtils.js'
import { badgeClass, badgeLabel } from '../lib/zoneCalc.js'
import { evaluateAllFlags } from '../lib/redFlags.js'

export default function HistoryView({ logs, onSelectDate }) {
  const entries = useMemo(() => {
    const keys = Object.keys(logs).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    return keys.map((iso) => {
      const log = logs[iso]
      const dp = findDay(iso)
      const triggeredIds = evaluateAllFlags(logs, iso).map((f) => f.id)
      return {
        iso,
        date: iso,
        log,
        type: dp?.day?.type ?? 'rest',
        title: dp?.day?.title ?? '(free date)',
        triggeredIds,
      }
    })
  }, [logs])

  const sparkline = useMemo(() => buildSparkline(logs), [logs])

  if (entries.length === 0) {
    return (
      <div className="px-4 py-6">
        <Header />
        <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-6 text-center">
          <p className="text-base font-semibold text-slate-800">No logs yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Open the Today tab and fill in today's metrics — they'll show up
            here as soon as you save anything.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <Header />

      {sparkline && (
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-900">Recovery Trend</h2>
          <p className="text-[12px] text-slate-500 mb-2">
            HRV (green) and next-day tendon pain (red), most recent on the right.
          </p>
          <Sparkline {...sparkline} />
        </section>
      )}

      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.iso}>
            <button
              type="button"
              onClick={() => onSelectDate(entry.iso)}
              className="tap w-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-3 text-left flex items-start gap-3 hover:ring-sky-300 active:bg-sky-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-slate-900">
                    {prettyDate(entry.iso)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${badgeClass(entry.type)}`}
                  >
                    {badgeLabel(entry.type)}
                  </span>
                  {entry.log.completed && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-300">
                      Done
                    </span>
                  )}
                  {entry.triggeredIds.map((id) => <FlagBadge key={id} id={id} />)}
                </div>
                <p className="mt-0.5 text-[12px] text-slate-600 truncate">{entry.title}</p>
                <p className="mt-1 text-[12px] text-slate-500">
                  Pain: <span className="font-medium tabular-nums">{fmtNum(entry.log.tendonPainDuring)}</span>
                  {' → '}
                  <span className="font-medium tabular-nums">{fmtNum(entry.log.tendonPainNextAM)}</span>
                  {'  · HRV '}
                  <span className="font-medium tabular-nums">{fmtNum(entry.log.hrv)}</span>
                  {'  · RHR '}
                  <span className="font-medium tabular-nums">{fmtNum(entry.log.rhr)}</span>
                </p>
              </div>
              <span aria-hidden="true" className="text-slate-400 mt-1">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Header() {
  return (
    <header className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">History</p>
      <h1 className="text-xl font-semibold text-slate-900">Logged days</h1>
      <p className="text-[12px] text-slate-500 mt-0.5">
        Most recent first. Tap any row to jump back and edit.
      </p>
    </header>
  )
}

// Per red-flag rule: short label, tone (amber=advisory / red=severe per
// spec §7 ankle-flag treatment), and full title for the tooltip.
const FLAG_BADGES = {
  tendon_pain:     { short: 'Tendon',   tone: 'amber', title: 'Tendon pain elevated' },
  ankle_flag:      { short: 'Ankle',    tone: 'red',   title: 'Ankle red flag' },
  recovery_flag:   { short: 'Recovery', tone: 'amber', title: 'Recovery markers flagged' },
  performance_flag:{ short: 'Effort↑', tone: 'amber', title: 'Session harder than expected' },
  weight_flag:     { short: 'Weight',   tone: 'amber', title: 'Unintended weight loss' },
}

const FLAG_TONE_CLASS = {
  amber: 'bg-amber-100 text-amber-900 ring-amber-300',
  red:   'bg-red-100 text-red-900 ring-red-300',
}

function FlagBadge({ id }) {
  const def = FLAG_BADGES[id]
  if (!def) return null
  return (
    <span
      title={def.title}
      aria-label={def.title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${FLAG_TONE_CLASS[def.tone]}`}
    >
      <span aria-hidden="true">⚑</span>
      {def.short}
    </span>
  )
}

function fmtNum(v) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return '—'
  return String(v)
}

// Tiny inline-SVG sparkline — pulls out pairs of (hrv, tendonPainNextAM)
// for the last N logged days. Two series, same y-axis (inverted for
// the pain line so it reads as "down = bad").
function buildSparkline(logs, maxPoints = 30) {
  const ordered = Object.keys(logs)
    .sort()
    .slice(-maxPoints)
  const points = ordered.map((iso) => ({
    iso,
    hrv: typeof logs[iso]?.hrv === 'number' ? logs[iso].hrv : null,
    pain: typeof logs[iso]?.tendonPainNextAM === 'number' ? logs[iso].tendonPainNextAM : null,
  }))
  const hrvValues = points.map((p) => p.hrv).filter((v) => v != null)
  if (hrvValues.length < 2) return null
  return { points }
}

function Sparkline({ points }) {
  const W = 320
  const H = 80
  const padX = 6
  const padY = 8

  const hrvValues = points.map((p) => p.hrv).filter((v) => v != null)
  const painValues = points.map((p) => p.pain).filter((v) => v != null)
  const xAt = (i) =>
    padX + (i / Math.max(1, points.length - 1)) * (W - padX * 2)

  const yForHrv = (v) => {
    if (!hrvValues.length) return padY
    const min = Math.min(...hrvValues)
    const max = Math.max(...hrvValues)
    const range = Math.max(1, max - min)
    return padY + (1 - (v - min) / range) * (H - padY * 2)
  }
  const yForPain = (v) => {
    if (!painValues.length) return padY
    // Pain: 0..10. Lower (less pain) = higher on chart = better.
    const min = 0
    const max = 10
    const range = Math.max(1, max - min)
    return padY + (1 - (v - min) / range) * (H - padY * 2)
  }

  const hrvPath = points
    .map((p, i) => (p.hrv != null ? `${i === 0 ? '' : 'L'}${xAt(i)},${yForHrv(p.hrv)}` : ''))
    .join(' ')
  const painPath = points
    .map((p, i) => (p.pain != null ? `${i === 0 ? '' : 'L'}${xAt(i)},${yForPain(p.pain)}` : ''))
    .join(' ')

  const firstHrv = xAt(points.findIndex((p) => p.hrv != null))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Recovery trend sparkline"
      className="w-full h-20"
    >
      {hrvPath && (
        <path d={`M${hrvPath.replace(/^L/, 'L')}`} fill="none" stroke="#059669" strokeWidth="2" />
      )}
      {painPath && (
        <path
          d={`M${painPath.replace(/^L/, 'L')}`}
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.6"
        />
      )}
      {!hrvPath && (
        <text x={W / 2} y={H / 2} textAnchor="middle" className="fill-slate-400 text-[10px]">
          not enough HRV data
        </text>
      )}
    </svg>
  )
}
