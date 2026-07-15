# Build Prompt: Whistler GranFondo Training Companion (React PWA)



## 1. Role & Objective

You are building a **mobile-first training companion webapp** for an athlete following an 8-week cycling training plan ahead of the RBC GranFondo Whistler (Sept 12, 2026). The app is used almost exclusively on a phone browser, hosted for free as a static site on **GitHub Pages**.

Core capability: each day, the athlete opens the app and immediately sees **today's workout and nutrition guidance**, logs a handful of daily health/training metrics, and gets **automatic in-app warnings** when their logged data crosses defined safety thresholds ("red flags"). Indoor cycling sessions are prescribed as **%LTHR heart-rate zones**, not power — the athlete enters their tested LTHR (lactate threshold heart rate) once, and the app computes live BPM targets for every indoor session from that number.

This is a solo, single-device tool. **No backend, no accounts, no login.** All personal data (daily logs, LTHR values) lives in the browser's `localStorage` on the athlete's phone.

---

## 2. Hard Constraints (do not deviate)

- **Stack:** React + Vite. TypeScript is welcome but not required — use plain JS with clear prop shapes if that's faster to ship correctly.
- **Hosting:** GitHub Pages, static build only. No server, no serverless functions, no API routes.
- **Data persistence:** `localStorage` only. No cloud sync, no external database, no third-party backend-as-a-service.
- **Notifications:** In-app banners only, rendered when the app is opened. Do **not** build push notifications, service-worker notification triggers, or anything requiring a notification permission prompt. This is explicitly out of scope.
- **Routing:** Prefer a **single route with client-side tab state** (no react-router) to sidestep GitHub Pages' lack of server-side SPA rewrites. If you do use a router, it must be `HashRouter` — never `BrowserRouter` — or you must ship a `404.html` redirect trick. Simpler is better here; this app does not need deep-linkable URLs.
- **Source of truth:** `plan-data.json` (provided) is the complete, authoritative content for every day of the plan, all zone definitions, the field-test protocol, the red-flag rules, and the nutrition reference. Copy it into `src/data/planData.json` and treat it as read-only reference data. Do not regenerate, re-derive, or "improve" its content — display it faithfully.
- **FTP/power zones are static** — there is no feature to edit FTP or outdoor power numbers. Only **LTHR is user-editable**, because only indoor sessions are prescribed as %LTHR.

---

## 3. Data File: `plan-data.json`

Already generated and provided alongside this prompt. Shape summary (do not hand-author this data — read it programmatically):

```
{
  athlete: { heightCm, weightKg, ftpWatts, raceDate, raceGoal, vo2max },
  powerZones: [ { id, label, minWatts, maxWatts, use } ],
  hrZones: [ { id, label, pctLTHRmin, pctLTHRmax, rpe, cadence } ],
  fieldTestProtocol: [ "...", "...", ... ],
  redFlags: [ { id, label, rule, action, fields } ],
  nutrition: [ "...", "...", ... ],
  weeks: [
    {
      id, title, dates, phase, hours, lthrPeriod,  // lthrPeriod: "lthr1" | "lthr2" | null
      days: [
        {
          day,        // "Mon".."Sun"
          date,       // ISO "2026-07-13"
          type,       // "recovery" | "rest" | "gym_combined" | "outdoor_hills" | "outdoor_long" | "golf_gym_lower" | "race"
          title,
          details,    // full prose description, always safe to render as-is
          indoor      // ONLY present on type:"gym_combined" days:
                      // { isFieldTest: bool, zone: string|null (id into hrZones), intervals: string|null, recovery: string|null }
        }, ...
      ]
    }, ...
  ]
}
```

Key facts your implementation must respect:
- 9 week-blocks total: Week 1 – Week 8, then a final short **Race Week** (6 days, Mon–Sat, race day is the Saturday).
- `lthrPeriod` tells you which LTHR value (`lthr1` from the Week 1 field test, or `lthr2` from the Week 5 retest) applies to that week's indoor BPM calculations. Weeks 1–4 use `lthr1`; Weeks 5–8 use `lthr2`; Race Week has no indoor sessions (`lthrPeriod: null`).
- Days with `indoor.isFieldTest === true` (Week 1 Wed, Week 5 Wed) are special: show the `fieldTestProtocol` steps instead of a computed BPM target, since LTHR doesn't exist yet for that period.
- Days with `indoor.zone` set (a string id like `"z4_sweetspot"`) should look up that zone in `hrZones` and compute a live BPM range from the athlete's current LTHR for that period.

---

## 4. Information Architecture

Single page, **three tabs** (bottom nav bar, thumb-reachable on mobile):

1. **Today** (default/home tab)
2. **History**
3. **Settings**

No hamburger menus, no nested navigation. Everything reachable in one tap.

### 4.1 Today Tab

- Header: current date, week phase label (e.g. "Week 3 · Build 1 (Peak)"), and days-until-race countdown.
- Day/date navigator: `‹ Prev Day` / `Next Day ›` arrows (or swipe) so the athlete can browse forward/back through the whole plan — defaults to the device's actual current date via `new Date()`, matched against `day.date` in `plan-data.json`.
  - If the current device date falls **outside** the plan's date range (before 2026-07-13 or after 2026-09-12), show a friendly empty state ("Outside the training plan window") and let them navigate manually into the range.
- **Workout Card** for the selected day:
  - Title, type badge (color-coded — see §7), full `details` prose.
  - **If `indoor` is present and not a field test:** show a computed line, e.g. *"Target: 173–180 bpm (Zone 4 / Sweet Spot, 95–99% of LTHR 182) · RPE 6–7 · Cadence 90–95rpm · 3 × 8 min, 4 min easy between"*. If the relevant LTHR (`lthr1`/`lthr2` per `lthrPeriod`) hasn't been entered yet in Settings, show the %/RPE/cadence info but replace the bpm number with a prompt: *"Enter your LTHR in Settings to see bpm targets."*
  - **If `indoor.isFieldTest === true`:** render the `fieldTestProtocol` steps as a numbered checklist, and prominently prompt the athlete to enter the resulting LTHR in Settings once done (deep-link to the Settings tab).
- **Nutrition Card:** always visible below the workout, rendering the `nutrition` reference list (same content every day — it's a standing reference, not day-specific).
- **Red Flag Banner(s):** rendered at the very top of the Today tab, above the date header, whenever any rule in §5 evaluates true for the currently selected date. Multiple simultaneous flags stack as separate banners. Each banner shows the `label` and `action` text from the matching `redFlags` entry, in an unmissable but non-alarmist style (see §7 for color treatment — amber/red, not a modal that blocks the UI).
- **Daily Log Form**, below the cards, for the selected date:
  - Tendon pain during activity (0–10 slider or numeric stepper)
  - Tendon pain next-morning (0–10 slider or numeric stepper)
  - Ankle confidence (0–10)
  - Ankle swelling? (toggle, default off)
  - Ankle giving-way episode? (toggle, default off)
  - HRV (ms, numeric)
  - RHR (bpm, numeric)
  - Sleep (hours, numeric, allow decimals like 7.5)
  - Body weight (kg, numeric, optional)
  - "Today's key session felt harder than it should have" (toggle) — only show this control on days where `type` is not `rest`/`recovery`
  - Notes (free text)
  - Done/completed toggle for the day's session
  - All numeric inputs must use `inputMode="decimal"` or `inputMode="numeric"` so the phone keyboard shows number pads.
  - **Autosave** on change (debounced ~500ms) to `localStorage` — no explicit "Save" button required, but show a small transient "Saved" confirmation.

### 4.2 History Tab

- Reverse-chronological list of all dates that have **any** logged data, most recent first.
- Each row: date, day type badge, tendon pain (during→next-AM), a small icon if that day triggered any red flag, "Done" check.
- Tapping a row jumps back to the Today tab pre-loaded with that date selected for editing.
- A simple line chart (any lightweight charting approach, e.g. inline SVG or a small dependency) plotting tendon pain (next-AM) and HRV over time is a nice-to-have if time allows — not required for done-ness.

### 4.3 Settings Tab

- **LTHR 1** (Week 1 test result, bpm, numeric input)
- **LTHR 2** (Week 5 retest result, bpm, numeric input, optional until Week 5)
- Short static explanation of what LTHR is and why it's tested twice (pull tone from `fieldTestProtocol`/plan context — keep it to 2–3 sentences).
- Athlete profile (read-only display from `athlete` object in the data file — height, weight, FTP, VO2max, race goal) purely for context, not editable.
- **"Reset all my data"** button — clears logs and LTHR values from `localStorage` after a confirmation dialog. Include this; it's important for testing and for the athlete's peace of mind.

---

## 5. Red Flag Engine

Implement one pure function per rule in `redFlags`, each taking the full logs object and a target date, returning `true`/`false`. Evaluate all five against the **currently selected date** on the Today tab (using data up to and including that date). Implement as follows:

1. **`tendon_pain`** — true if `tendonPainNextAM > 5` on the selected date, **or** if the last 3 consecutive calendar days that have a logged `tendonPainNextAM` value show a strictly increasing trend.
2. **`ankle_flag`** — true if `ankleSwelling` or `ankleGivingWay` is `true` on the selected date.
3. **`recovery_flag`** — true if, on the selected date **and** the prior calendar day, both: (a) HRV is more than 20–25% below the trailing 7-day average HRV (computed from logged days only, minimum 3 data points required or skip the check), **and** (b) RHR is 5–7+ bpm above the trailing 7-day average RHR.
4. **`performance_flag`** — true if `sessionFeltHarder` is `true` on 2 or more days within the trailing 7 calendar days (inclusive of the selected date).
5. **`weight_flag`** — true if the average `bodyWeightKg` over the trailing 7 days is more than 1% lower than the average over the 7 days before that, for **two consecutive such weekly comparisons** (i.e. the drop has now persisted through a second week).

**Judgment call guidance:** where a rule requires data that isn't logged yet (e.g. not enough history for a 7-day average), simply don't fire that flag — don't error, don't guess. When in doubt about an edge case not explicitly covered above, prefer the interpretation that would surface a flag over one that would silently suppress it — these are athlete-safety signals, not cosmetic UI.

---

## 6. Data Model (localStorage)

Single key, versioned to survive future schema changes:

```js
localStorage.setItem("granfondo-plan-v1", JSON.stringify({
  settings: {
    lthr1: null,      // number | null
    lthr2: null,       // number | null
  },
  logs: {
    "2026-07-13": {
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
      notes: ""
    }
    // ...one entry per date the athlete has touched
  }
}));
```

Build a small `storage.js` module wrapping `get()`/`set()` with `try/catch` (private browsing / storage-full edge cases should not crash the app — fail silently to in-memory state and show a small non-blocking warning).

---

## 7. Visual Design Direction

- Mobile-first, single column, generous tap targets (min 44px), bottom tab bar fixed to viewport bottom.
- Clean, calm, athletic feel — not clinical/spreadsheet-like. This is a training companion, not a medical chart.
- Color-code day `type` badges distinctly, e.g.:
  - `outdoor_hills` / `outdoor_long` → blue tones (outdoor/power-based)
  - `gym_combined` / `golf_gym_lower` → green tones (gym/HR-based)
  - `rest` / `recovery` → neutral gray
  - `race` → gold/amber, visually special
- Red flag banners: amber background for single/borderline flags, red for the `ankle_flag` (this one is a hard stop per the plan and should look more severe than the others) — but never a blocking modal; the athlete should always be able to dismiss/scroll past and still use the app.
- Use Tailwind CSS for styling velocity and consistent mobile spacing utilities, unless you have a strong reason to prefer something else.
- Dark mode is a nice-to-have, not required.

---

## 8. Suggested File Structure

```
src/
  main.jsx
  App.jsx                    // tab state + layout shell
  data/planData.json          // copied verbatim from provided plan-data.json
  lib/
    storage.js                 // localStorage get/set wrapper
    zoneCalc.js                 // LTHR + hrZone -> bpm range calculator
    redFlags.js                 // the 5 rule functions from §5
    dateUtils.js                 // today lookup, prev/next day, trailing-window helpers
  components/
    TabBar.jsx
    TodayView.jsx
    WorkoutCard.jsx
    NutritionCard.jsx
    RedFlagBanner.jsx
    LogForm.jsx
    HistoryView.jsx
    SettingsView.jsx
```

---

## 9. Deployment (GitHub Pages via GitHub Actions)

1. In `vite.config.js`, set `base: "./"` (relative base path) — this avoids hardcoding a repo name and works whether the site ends up as a project page or user page.
2. Add this workflow at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

3. In the repo's GitHub Settings → Pages, set **Source: GitHub Actions** (not "Deploy from a branch").
4. Confirm the deployed URL loads correctly on an actual phone browser, not just desktop viewport — check tap targets, input keyboards, and that the bottom tab bar doesn't get obscured by mobile browser chrome.

---

## 10. Optional Stretch Goals (only after core is done and verified)

- PWA installability via `vite-plugin-pwa` (manifest + service worker for offline asset caching and "Add to Home Screen"). This is about installability/offline access, **not** push notifications — still in scope for the constraint in §2.
- Simple sparkline/line chart in History for pain and HRV trends.
- CSV export of logs from Settings (pure client-side download, no backend) as a manual backup option.

---

## 11. Explicitly Out of Scope

Do not build any of the following — they were deliberately excluded:
- Push notifications / background notification scheduling
- Any backend, database, or multi-device sync
- User accounts, login, or auth of any kind
- FTP or outdoor power-zone editing (only LTHR is editable)
- Re-parsing the original `.docx` at runtime — `plan-data.json` is the sole content source

---

## 12. Definition of Done

- [ ] `npm run dev` runs locally with no console errors
- [ ] Today tab correctly resolves the device's current date to the matching plan day, with working prev/next navigation across all 62 days including Race Week
- [ ] Indoor sessions show correctly computed bpm ranges once LTHR is entered, correctly switching from `lthr1` to `lthr2` at the Week 5 boundary, and gracefully prompt for LTHR entry beforehand
- [ ] Field-test days (Week 1 Wed, Week 5 Wed) render the field-test protocol instead of a bpm target
- [ ] All 5 red flag rules are implemented per §5 and visibly banner on the Today tab when triggered (verify by hand-entering test data that should trigger each one, then using "Reset all my data" to clear it before handing off)
- [ ] Daily log form autosaves to `localStorage` and persists across page reloads
- [ ] History tab lists all logged days and lets you jump back to edit any of them
- [ ] Settings tab LTHR inputs persist and immediately affect Today tab calculations
- [ ] Layout is usable one-handed on a real phone screen (test at ~375px width minimum)
- [ ] GitHub Actions workflow deploys successfully and the live GitHub Pages URL works on a phone browser
- [ ] No dead links, no console errors, no references to backend/cloud services anywhere in the code

If you hit a genuine ambiguity not resolved by this document or by `plan-data.json`, make the most reasonable athlete-friendly choice, note the assumption in a code comment, and keep building — do not stop to ask unless something is truly blocking (e.g., missing credentials).