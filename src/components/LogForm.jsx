// Daily log form. Every field autosaves (debounced) into localStorage on
// change. Numeric inputs target the phone's number/decimal keyboard.
// Per spec §4.1: the "felt harder" toggle only appears on days that
// aren't rest/recovery; everything else is always shown.

import React, { useEffect, useRef, useState } from 'react'
import { normalizeLog } from '../lib/storage.js'
import { prettyDate } from '../lib/dateUtils.js'

const DEFAULTS = {
  tendonPainDuring: null,
  tendonPainNextAM: null,
  ankleConfidence: null,
  ankleSwelling: false,
  ankleGivingWay: false,
  hrv: null,
  rhr: null,
  sleepHours: null,
  bodyWeightKg: null,
  sessionFeltHarder: false,
  completed: false,
  notes: '',
  updatedAt: '',
}

export default function LogForm({ iso, dayType, initial, onChange, savedAt }) {
  // Initialize from `initial` (the persisted entry), defaulting to an
  // empty template.
  const [entry, setEntry] = useState(() => normalizeLog({ ...DEFAULTS, ...(initial || {}) }))
  const isRestOrRecovery = dayType === 'rest' || dayType === 'recovery'

  const debounceRef = useRef(null)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange?.({ ...entry, updatedAt: new Date().toISOString() })
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [entry, onChange])

  function update(patch) {
    setEntry((prev) => ({ ...prev, ...patch }))
  }

  return (
    <section
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden"
      aria-label={`Log for ${prettyDate(iso)}`}
    >
      <header className="flex items-baseline justify-between px-4 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Daily log
          </p>
          <h2 className="text-base font-semibold text-slate-900">{prettyDate(iso)}</h2>
        </div>
        <SaveIndicator savedAt={savedAt} />
      </header>

      <div className="px-4 py-3 space-y-1.5">
        <NumberRow
          label="Tendon pain during activity"
          field="tendonPainDuring"
          value={entry.tendonPainDuring}
          min={0}
          max={10}
          step={1}
          onChange={(v) => update({ tendonPainDuring: v })}
        />
        <NumberRow
          label="Tendon pain next morning"
          field="tendonPainNextAM"
          value={entry.tendonPainNextAM}
          min={0}
          max={10}
          step={1}
          onChange={(v) => update({ tendonPainNextAM: v })}
        />
        <NumberRow
          label="Ankle confidence"
          field="ankleConfidence"
          value={entry.ankleConfidence}
          min={0}
          max={10}
          step={1}
          onChange={(v) => update({ ankleConfidence: v })}
        />
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <Toggle
          label="Ankle swelling"
          checked={entry.ankleSwelling}
          onChange={(v) => update({ ankleSwelling: v })}
        />
        <Toggle
          label="Ankle giving-way"
          checked={entry.ankleGivingWay}
          onChange={(v) => update({ ankleGivingWay: v })}
        />
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-3">
        <NumberInput
          label="HRV (ms)"
          field="hrv"
          value={entry.hrv}
          inputMode="numeric"
          onChange={(v) => update({ hrv: v })}
        />
        <NumberInput
          label="RHR (bpm)"
          field="rhr"
          value={entry.rhr}
          inputMode="numeric"
          onChange={(v) => update({ rhr: v })}
        />
        <NumberInput
          label="Sleep (hours)"
          field="sleepHours"
          value={entry.sleepHours}
          inputMode="decimal"
          step={0.1}
          onChange={(v) => update({ sleepHours: v })}
        />
        <NumberInput
          label="Body weight (kg)"
          field="bodyWeightKg"
          value={entry.bodyWeightKg}
          inputMode="decimal"
          step={0.1}
          onChange={(v) => update({ bodyWeightKg: v })}
        />
      </div>

      <div className="px-4 pb-3 grid grid-cols-1 gap-2">
        {!isRestOrRecovery && (
          <Toggle
            label="Today's key session felt harder than it should have"
            checked={entry.sessionFeltHarder}
            onChange={(v) => update({ sessionFeltHarder: v })}
            warn={entry.sessionFeltHarder}
          />
        )}
        <Toggle
          label="Done — completed today's session"
          checked={entry.completed}
          onChange={(v) => update({ completed: v })}
          ok={entry.completed}
        />
      </div>

      <div className="px-4 pb-4">
        <label className="block text-[12px] font-medium text-slate-700 mb-1" htmlFor="notes-input">
          Notes
        </label>
        <textarea
          id="notes-input"
          rows={3}
          value={entry.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Anything worth remembering…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
      </div>
    </section>
  )
}

// Persistent "Saved <time>" indicator on the LogForm header. Replaces
// the previous transient "Saved ✓" — the athlete can now confirm
// persistence at a glance without watching for a flash.
function SaveIndicator({ savedAt }) {
  const label = formatSavedAt(savedAt)
  if (!label) return null
  return (
    <span
      aria-live="polite"
      aria-label={label}
      className="text-[12px] font-medium text-emerald-600 inline-flex items-center gap-1"
    >
      <span aria-hidden="true">✓</span>
      <span>{label}</span>
    </span>
  )
}

// Format an ISO timestamp into a short, human-readable label that's
// meaningful at a glance:
//   same day:    "Saved 2:47 PM"
//   yesterday:   "Saved yesterday, 2:47 PM"
//   within week: "Saved Mon, 2:47 PM"
//   older:       "Saved Jul 14, 2:47 PM"
// Returns null if `savedAtIso` is falsy or invalid.
function formatSavedAt(savedAtIso, now = new Date()) {
  if (!savedAtIso) return null
  const date = new Date(savedAtIso)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const savedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - savedDay.getTime()) / 86400000)
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 0) return `Saved ${time}`
  if (diffDays === 1) return `Saved yesterday, ${time}`
  if (diffDays < 7) {
    const day = date.toLocaleDateString(undefined, { weekday: 'short' })
    return `Saved ${day}, ${time}`
  }
  const long = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `Saved ${long}, ${time}`
}

function NumberRow({ label, field, value, min, max, step, onChange }) {
  return (
    <div className="grid grid-cols-[1fr,auto] items-center gap-2 py-1.5">
      <div>
        <label htmlFor={`f-${field}`} className="block text-[13px] font-medium text-slate-800">
          {label} <span className="text-slate-400 font-normal">/10</span>
        </label>
        <input
          id={`f-${field}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-600"
        />
      </div>
      <input
        type="number"
        inputMode="numeric"
        name={`f-num-${field}`}
        value={value == null ? '' : value}
        min={min}
        max={max}
        step={step}
        aria-label={`${label} numeric`}
        onChange={(e) => {
          const t = e.target.value
          if (t === '') return onChange(null)
          const n = Number(t)
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)))
        }}
        className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-[15px] tabular-nums"
      />
    </div>
  )
}

function NumberInput({ label, field, value, inputMode, step = 1, onChange }) {
  return (
    <div>
      <label htmlFor={`f-${field}`} className="block text-[12px] font-medium text-slate-700">
        {label}
      </label>
      <input
        id={`f-${field}`}
        type="number"
        inputMode={inputMode}
        step={step}
        value={value == null ? '' : value}
        onChange={(e) => {
          const t = e.target.value
          if (t === '') return onChange(null)
          const n = Number(t)
          onChange(Number.isFinite(n) ? n : null)
        }}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] tabular-nums focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
      />
    </div>
  )
}

function Toggle({ label, checked, onChange, warn, ok }) {
  const accent = warn
    ? checked
      ? 'bg-amber-100 text-amber-900 ring-amber-300'
      : 'bg-slate-100 text-slate-700 ring-slate-200'
    : ok && checked
      ? 'bg-emerald-100 text-emerald-900 ring-emerald-300'
      : 'bg-slate-100 text-slate-700 ring-slate-200'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`tap w-full rounded-xl ring-1 px-3 py-2 text-left text-[13px] font-medium ${accent} hover:brightness-95`}
    >
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <span
          aria-hidden="true"
          className={`relative h-6 w-10 flex-none rounded-full ${checked ? 'bg-sky-600' : 'bg-slate-300'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </span>
      </span>
    </button>
  )
}
