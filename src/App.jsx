// Top-level shell. Three tabs, single source of truth for the global
// state (settings, logs, selectedDate). Persistence is debounced via
// the storage wrapper.

import React, { useCallback, useEffect, useReducer, useState } from 'react'
import {
  consumeStorageWarning,
  isMemoryOnly,
  loadState,
  normalizeLog,
  saveState,
  resetAll,
} from './lib/storage.js'
import { defaultSelectedDate, PLAN_START, isInPlan } from './lib/dateUtils.js'
import TabBar from './components/TabBar.jsx'
import TodayView from './components/TodayView.jsx'
import HistoryView from './components/HistoryView.jsx'
import SettingsView from './components/SettingsView.jsx'

const INITIAL_STATE = {
  settings: { lthr1: null, lthr2: null },
  logs: {},
  selectedDate: defaultSelectedDate(),
  activeTab: 'today',
}

function reducer(state, action) {
  switch (action.type) {
    case 'init':
      return { ...state, ...action.payload }
    case 'setTab':
      return { ...state, activeTab: action.tab }
    case 'setDate':
      return { ...state, selectedDate: action.iso }
    case 'setSettings':
      return { ...state, settings: action.settings }
    case 'setLog': {
      const next = { ...state.logs }
      if (action.entry == null) {
        delete next[action.iso]
      } else {
        next[action.iso] = action.entry
      }
      return { ...state, logs: next }
    }
    case 'reset':
      return {
        ...INITIAL_STATE,
        activeTab: 'today',
        selectedDate: defaultSelectedDate(),
      }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [storageWarn, setStorageWarn] = useState(false)
  const [memOnly, setMemOnly] = useState(false)

  // Hydrate from localStorage on mount (so a stale editor/refresh
  // doesn't blow away saved data).
  useEffect(() => {
    const loaded = loadState()
    dispatch({
      type: 'init',
      payload: {
        settings: loaded.settings,
        logs: loaded.logs,
        // Do not override selectedDate unless we have no plan data yet.
        selectedDate: defaultSelectedDate(),
      },
    })
  }, [])

  // Persist (debounced) whenever settings or logs change.
  useEffect(() => {
    saveState({ settings: state.settings, logs: state.logs })
  }, [state.settings, state.logs])

  const setTab = useCallback((tab) => dispatch({ type: 'setTab', tab }), [])
  const setDate = useCallback((iso) => dispatch({ type: 'setDate', iso }), [])
  const setSettings = useCallback((settings) => dispatch({ type: 'setSettings', settings }), [])
  const setLog = useCallback(
    (iso, entry) => dispatch({ type: 'setLog', iso, entry: entry ? normalizeLog(entry) : null }),
    [],
  )
  const resetEverything = useCallback(() => {
    resetAll()
    setStorageWarn(false)
    setMemOnly(false)
    dispatch({ type: 'reset' })
  }, [])

  const onSelectDate = useCallback((iso, entry) => {
    dispatch({ type: 'setDate', iso })
    if (entry !== undefined) {
      dispatch({ type: 'setLog', iso, entry: entry ? normalizeLog(entry) : null })
    }
    if (state.activeTab !== 'today') dispatch({ type: 'setTab', tab: 'today' })
  }, [state.activeTab])

  // Storage health check after every render path that may have failed
  // to persist.
  useEffect(() => {
    if (consumeStorageWarning()) setStorageWarn(true)
    if (isMemoryOnly()) setMemOnly(true)
  }, [state.settings, state.logs])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-md pb-24">
        {(storageWarn || memOnly) && (
          <div className="mx-4 mt-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3 py-2 text-[12px] text-amber-900">
            {memOnly
              ? "This browser's storage is full or unavailable. Your data is held in memory for this session and will be lost on refresh."
              : 'Local storage had a hiccup. Your latest save may not be persisted.'}
          </div>
        )}

        {state.activeTab === 'today' && (
          <TodayView
            logs={state.logs}
            settings={state.settings}
            selectedDate={state.selectedDate}
            onSelectDate={onSelectDate}
            onSetLog={setLog}
            onJumpToSettings={() => setTab('settings')}
          />
        )}
        {state.activeTab === 'history' && (
          <HistoryView logs={state.logs} onSelectDate={onSelectDate} />
        )}
        {state.activeTab === 'settings' && (
          <SettingsView
            settings={state.settings}
            onChange={setSettings}
            onReset={resetEverything}
          />
        )}
      </main>

      <TabBar active={state.activeTab} onChange={setTab} />
    </div>
  )
}
