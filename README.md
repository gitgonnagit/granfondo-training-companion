# Whistler GranFondo Training Companion

Mobile-first PWA for the RBC GranFondo Whistler 8-week plan (Sep 12, 2026).
Built per `build.md`. Static-only — no backend, no accounts, no push notifications.

## Stack
- React 18 + Vite 5
- Plain JS (no TS)
- Tailwind CSS for styling
- `localStorage` for all persistence
- GitHub Pages via GitHub Actions

## Local development
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serve the built dist
```

## Red-flag unit tests (offline, no test framework)
```bash
node scripts/test-redflags.mjs
```

Run after any change to `src/lib/redFlags.js`. Covers all 5 rules against
hand-crafted fixtures — the "tendon pain > 5 / strictly increasing on 3
consecutive days", "ankle swelling OR giving-way", "HRV ≤ 80% of trailing
average AND RHR ≥ +5, on today AND prior day", "session felt harder on 2+
days in the last 7", and "1% body-weight drop sustained across two weekly
comparisons".

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. In **Settings → Pages**, set **Source: GitHub Actions**.
3. Push to `main`; the workflow at `.github/workflows/deploy.yml` builds
   `npm run build` and deploys `dist/`.

Live URL is `https://<owner>.github.io/<repo>/`. Because `vite.config.js`
sets `base: './'`, asset paths are relative — the site works whether it
ends up as a project page or user page.

## File layout
```
src/
  main.jsx               # React entry
  App.jsx                # tab state, persistence wiring
  index.css              # Tailwind + small resets
  data/planData.json     # copy of the provided plan-data.json
  lib/
    storage.js           # localStorage wrapper with in-memory fallback
    dateUtils.js         # ISO date helpers + plan lookups
    zoneCalc.js          # LTHR → BPM zone calculations
    redFlags.js          # 5 configurable red-flag rules
  components/
    TabBar.jsx
    TodayView.jsx
    WorkoutCard.jsx
    NutritionCard.jsx
    RedFlagBanner.jsx
    LogForm.jsx
    HistoryView.jsx
    SettingsView.jsx
scripts/test-redflags.mjs
.github/workflows/deploy.yml
```
