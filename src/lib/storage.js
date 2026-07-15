// localStorage wrapper. Per spec §6: versioned key, in-memory fallback,
// never throw — surface a non-blocking warning instead.
//
// Schema:
//   granfondo-plan-v1 = { settings: { lthr1, lthr2 }, logs: { [isoDate]: LogEntry } }

const STORAGE_KEY = 'granfondo-plan-v1'

const DEFAULT_STATE = Object.freeze({
  settings: { lthr1: null, lthr2: null },
  logs: {},
})

const WARNING_FLAG = { current: false }

function safeParse(raw) {
  if (raw == null) return structuredClone(DEFAULT_STATE)
  try {
    const obj = JSON.parse(raw)
    return normalize(obj)
  } catch {
    return structuredClone(DEFAULT_STATE)
  }
}

function normalize(state) {
  const out = {
    settings: {
      lthr1: numberOrNull(state?.settings?.lthr1),
      lthr2: numberOrNull(state?.settings?.lthr2),
    },
    logs: {},
  }
  if (state?.logs && typeof state.logs === 'object') {
    for (const [k, v] of Object.entries(state.logs)) {
      if (typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === 'object') {
        out.logs[k] = normalizeLog(v)
      }
    }
  }
  return out
}

function numberOrNull(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function normalizeLog(raw) {
  return {
    tendonPainDuring: nullableNumber(raw.tendonPainDuring),
    tendonPainNextAM: nullableNumber(raw.tendonPainNextAM),
    ankleConfidence: nullableNumber(raw.ankleConfidence),
    ankleSwelling: !!raw.ankleSwelling,
    ankleGivingWay: !!raw.ankleGivingWay,
    hrv: nullableNumber(raw.hrv),
    rhr: nullableNumber(raw.rhr),
    sleepHours: nullableNumber(raw.sleepHours),
    bodyWeightKg: nullableNumber(raw.bodyWeightKg),
    sessionFeltHarder: !!raw.sessionFeltHarder,
    completed: !!raw.completed,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }
}

function nullableNumber(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// In-memory fallback state if localStorage write fails.
let memoryState = structuredClone(DEFAULT_STATE)
let memoryActive = false

function readRaw() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    memoryActive = true
    WARNING_FLAG.current = true
    return null
  }
}

function writeRaw(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
    return true
  } catch {
    memoryActive = true
    WARNING_FLAG.current = true
    return false
  }
}

export function loadState() {
  if (memoryActive) return structuredClone(memoryState)
  const raw = readRaw()
  if (raw == null) return structuredClone(DEFAULT_STATE)
  return safeParse(raw)
}

let writeTimer = null
let pendingState = null
export function saveState(state) {
  pendingState = state
  if (writeTimer) return
  writeTimer = setTimeout(() => {
    writeTimer = null
    const toWrite = pendingState
    pendingState = null
    const ok = writeRaw(JSON.stringify(toWrite))
    if (!ok) {
      // Persist in memory so the session still works.
      memoryState = structuredClone(toWrite)
    }
  }, 200)
}

export function resetAll() {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
    pendingState = null
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  memoryState = structuredClone(DEFAULT_STATE)
  WARNING_FLAG.current = false
  memoryActive = false
}

// Used by the app shell to show the "storage unavailable" banner.
export function consumeStorageWarning() {
  if (WARNING_FLAG.current) {
    WARNING_FLAG.current = false
    return true
  }
  return false
}

export function isMemoryOnly() {
  return memoryActive
}
