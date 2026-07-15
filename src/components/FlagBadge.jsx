// Per red-flag rule: short label, tone (amber = advisory, red = severe
// per spec §7 ankle-flag treatment), and full title for hover/aria
// tooltip. Shared between the History rows and the Today "Recent
// flags" widget so visual treatment is identical across the app.

import React from 'react'

export const FLAG_BADGES = {
  tendon_pain:     { short: 'Tendon',    tone: 'amber', title: 'Tendon pain elevated' },
  ankle_flag:      { short: 'Ankle',     tone: 'red',   title: 'Ankle red flag' },
  recovery_flag:   { short: 'Recovery',  tone: 'amber', title: 'Recovery markers flagged' },
  performance_flag:{ short: 'Effort↑',   tone: 'amber', title: 'Session harder than expected' },
  weight_flag:     { short: 'Weight',    tone: 'amber', title: 'Unintended weight loss' },
}

const FLAG_TONE_CLASS = {
  amber: 'bg-amber-100 text-amber-900 ring-amber-300',
  red:   'bg-red-100 text-red-900 ring-red-300',
}

export default function FlagBadge({ id }) {
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
