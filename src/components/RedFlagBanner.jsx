// Non-blocking red flag banner. Renders one banner per triggered flag.
// `ankle_flag` uses a more severe (red) treatment per spec §7.
// We never use a modal that blocks the UI.
//
// CTA mode: when `recovery_flag` or `weight_flag` fires, we render a
// primary "Swap to recovery day" / "Bump carbs + recover" button that
// one-tap writes `logs[iso].completed = false` via the callback prop.
// The banner itself stays visible after the swap so the athlete
// doesn't lose the underlying HRV/RHR or trend signal — the swap is
// just an acknowledgement of the spec's "action" sentence, not a
// silencing of the warning.

import React, { useState } from 'react'

// Per-flag CTA copy. Keeps the language aligned with the spec's
// original `action` text so the tap reads as the same recommendation,
// just compressed into one primary button.
const CTA_BY_FLAG = {
  recovery_flag: {
    label: 'Swap to recovery day',
    helper: "Acknowledges today's session as light/recovery. Tomorrow's HRV/RHR check stays in place.",
  },
  weight_flag: {
    label: 'Bump carbs + recover',
    helper: "Acknowledges today's load as recovery. We'll check the trend again in 7 days.",
  },
}

export default function RedFlagBanner({ flag, iso, onSwapToRecoveryDay }) {
  const [swapped, setSwapped] = useState(false)
  const isAnkle = flag.id === 'ankle_flag'
  const tone = isAnkle
    ? 'bg-red-50 ring-red-300 text-red-900'
    : 'bg-amber-50 ring-amber-300 text-amber-900'

  const cta = CTA_BY_FLAG[flag.id]
  const showCta = !swapped && cta && typeof onSwapToRecoveryDay === 'function'

  function handleSwap() {
    if (typeof onSwapToRecoveryDay !== 'function') return
    onSwapToRecoveryDay(flag.id)
    setSwapped(true)
  }

  return (
    <div
      role="alert"
      className={`rounded-2xl ring-1 ${tone} px-4 py-3 shadow-sm`}
    >
      <div className="flex items-start gap-2">
        <Icon severe={isAnkle} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{flag.label}</p>
          <p className="mt-0.5 text-[13px] leading-snug opacity-90">{flag.action}</p>
        </div>
      </div>

      {showCta && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={handleSwap}
            className="tap inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm ring-1 ring-sky-700 hover:bg-sky-700 active:scale-[0.98]"
            aria-label={`${cta.label} — acknowledge this ${flag.label} recommendation for ${iso}`}
          >
            <span aria-hidden="true">↻</span>
            {cta.label}
          </button>
          <span className="text-[12px] leading-snug opacity-80">{cta.helper}</span>
        </div>
      )}

      {swapped && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] font-semibold text-emerald-800 ring-1 ring-emerald-300">
            <span aria-hidden="true">✓</span>
            Marked today's session as recovery — banner remains for awareness
          </span>
        </div>
      )}
    </div>
  )
}

function Icon({ severe }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={severe ? 2.4 : 2}
      className="mt-0.5 flex-none"
      aria-hidden="true"
    >
      <path d="M12 3l10 18H2L12 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10v5" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}
