// Non-blocking red flag banner. Renders one banner per triggered flag.
// `ankle_flag` uses a more severe (red) treatment per spec §7.
// We never use a modal that blocks the UI.

import React from 'react'

export default function RedFlagBanner({ flag }) {
  const isAnkle = flag.id === 'ankle_flag'
  const tone = isAnkle
    ? 'bg-red-50 ring-red-300 text-red-900'
    : 'bg-amber-50 ring-amber-300 text-amber-900'

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
