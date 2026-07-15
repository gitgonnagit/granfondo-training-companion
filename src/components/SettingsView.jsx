// Settings tab — LTHR inputs, athlete-profile snapshot, reset button.
// Includes a tiny CSV export so the athlete can brain-dump logs into
// a spreadsheet if they want.

import React, { useState } from 'react'
import planData from '../data/planData.json' with { type: 'json' }

export default function SettingsView({ settings, onChange, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false)

  function update(field, value) {
    const v = value === '' ? null : Number(value)
    onChange?.({ ...settings, [field]: Number.isFinite(v) ? v : null })
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <Header />

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Lactate Threshold Heart Rate</h2>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          LTHR is the steady heart rate you can just barely sustain over a
          20-minute time trial. We test it twice — once in Week 1 and again
          in Week 5 — because it usually drifts up as your fitness improves.
          Every indoor session's BPM target is computed from whichever value
          applies to the week you're in.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <LthrInput
            label="LTHR 1 (Week 1 test)"
            value={settings.lthr1}
            onChange={(v) => update('lthr1', v)}
            hint="Weeks 1–4"
          />
          <LthrInput
            label="LTHR 2 (Week 5 retest)"
            value={settings.lthr2}
            onChange={(v) => update('lthr2', v)}
            hint="Weeks 5–8"
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-900">Athlete Profile</h2>
        <p className="text-[12px] text-slate-500 mb-3">
          Read-only snapshot from your training plan.
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
          <ProfileRow k="Height" v={`${planData.athlete.heightCm} cm`} />
          <ProfileRow k="Weight" v={`${planData.athlete.weightKg} kg`} />
          <ProfileRow k="FTP" v={`${planData.athlete.ftpWatts} W`} />
          <ProfileRow k="VO₂max" v={planData.athlete.vo2max} />
          <ProfileRow k="Race date" v={planData.athlete.raceDate} />
          <ProfileRow k="Goal" v={planData.athlete.raceGoal} />
        </dl>
      </section>

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Data</h2>
        {!confirmReset ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="tap rounded-xl bg-red-100 px-3 py-2 text-[13px] font-semibold text-red-800 ring-1 ring-red-300 hover:bg-red-200"
            >
              Reset all my data
            </button>
            <CsvExportLink />
          </div>
        ) : (
          <div className="rounded-xl bg-red-50 ring-1 ring-red-300 p-3 space-y-2">
            <p className="text-[13px] text-red-900">
              Clear all logs and LTHR values from this device? This cannot be undone
              (you can export a CSV first if you want a backup).
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="tap rounded-lg bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 ring-1 ring-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onReset?.()
                  setConfirmReset(false)
                }}
                className="tap rounded-lg bg-red-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-red-700"
              >
                Yes, reset
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Header() {
  return (
    <header className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">Settings</p>
      <h1 className="text-xl font-semibold text-slate-900">Configure</h1>
    </header>
  )
}

function LthrInput({ label, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-700" htmlFor={label}>
        {label}
      </label>
      <div className="mt-1 flex">
        <input
          id={label}
          type="number"
          inputMode="numeric"
          value={value == null ? '' : value}
          min={100}
          max={220}
          placeholder="bpm"
          onChange={(e) => {
            const t = e.target.value
            if (t === '') return onChange('')
            onChange(t)
          }}
          className="flex-1 rounded-l-lg border border-slate-300 bg-white px-3 py-2 text-[15px] tabular-nums focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <span className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-3 text-[12px] text-slate-600">
          bpm
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </div>
  )
}

function ProfileRow({ k, v }) {
  return (
    <>
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-slate-900 font-medium">{v}</dd>
    </>
  )
}

function CsvExportLink() {
  // Pull logs out of window at click-time. We don't want this in a
  // render closure because logs change regularly; rebuilding href each
  // render would also force a download every time the user opened the
  // tab.
  function onClick() {
    let raw
    try {
      raw = window.localStorage.getItem('granfondo-plan-v1')
    } catch {
      return
    }
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      const csv = toCsv(data.logs || {})
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `granfondo-logs-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap rounded-xl bg-slate-100 px-3 py-2 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-200"
    >
      Export logs (CSV)
    </button>
  )
}

function toCsv(logs) {
  const cols = [
    'date',
    'tendonPainDuring',
    'tendonPainNextAM',
    'ankleConfidence',
    'ankleSwelling',
    'ankleGivingWay',
    'hrv',
    'rhr',
    'sleepHours',
    'bodyWeightLbs',
    'sessionFeltHarder',
    'completed',
    'notes',
  ]
  const rows = [cols.join(',')]
  for (const iso of Object.keys(logs).sort()) {
    const e = logs[iso]
    const cells = cols.map((c) => {
      const v = e[c]
      if (v == null) return ''
      const s = String(v).replace(/"/g, '""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    })
    rows.push(cells.join(','))
  }
  return rows.join('\n')
}


