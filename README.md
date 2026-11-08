# Objectif 10 ans — cr10-app

Daily prep for the **carte de résident (10 years)**: the civic exam (CR level) and French B1 (TCF/TEF IRN).
Successor of [`carte-resident-prep`](https://github.com/weskhaled/carte-resident-prep), which stays live as the fallback.

**Live: <https://weskhaled.github.io/cr10-app/>** — deployed by `.github/workflows/deploy.yml` on every push to `main`.
On a phone: open it in Safari → Share → Add to Home Screen (offline + progress kept).

Nuxt 4 · Nuxt UI 4 (Reka UI + Tailwind 4) · VueUse · @nuxtjs/i18n · client-only, static output, data in `localStorage`.

Interface in **English, French or Arabic** (right-to-left), picked from the phone's language on first visit and
switchable in the header or Settings. Texts live in `i18n/locales/{en,fr,ar}.json` (plural rules in
`i18n/i18n.config.ts`; `tests/i18n.test.ts` checks the three files stay in sync). Exam content — questions,
propositions, explanations — stays in French and is marked `lang="fr" dir="ltr"`.

## Run

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # unit tests (deadline engine, spaced repetition, daily plan)
pnpm typecheck
pnpm lint
pnpm generate     # static site in .output/public
pnpm serve:dist   # try the build (service worker, offline) on http://localhost:3011
pnpm audio        # (re)build the morning-audio clips — macOS only, uses the system French voice
```

## What's inside

| Path | What |
|---|---|
| `app/pages/index.vue` | **Today** — deadlines, today's reviews + new items per track, streak, last 14 days |
| `app/pages/session/[track].vue` · `app/components/QuizCard.vue` | Study session (`civic` / `french`): due reviews first, then new items. Tap an answer or **I don't know**; feedback shows your answer vs the right one, why, and the fiche; a bar pinned at the bottom holds **Continue** / **I guessed** (a lucky guess comes back tomorrow). Keys: 1–4 / A–D, 0 = don't know, Enter = continue, G = guessed. Summary lists what to remember |
| `app/pages/official.vue` · `app/components/QuestionCard.vue` | Official questions. **Study**: pick a theme, each question shows its 4 propositions — tap one to test yourself or show the answer; **Practise 10 questions** runs a scored session on that theme (`/session/civic?theme=…`). **Check answers**: drafted answers with the fiche and the check buttons |
| `app/pages/level.vue` | **French level check**: grammar, reading, listening placement (A1 → B2, stops at the first failed level) + writing/speaking self-assessment; estimate per skill vs B1 |
| `app/pages/listen.vue` | **Morning audio**: today's mix (new civic questions, missed ones, French listening, then upcoming) sized to the commute; lock-screen controls; save for offline |
| `app/pages/settings.vue` | Expiry + exam dates, backup export/import, reset |
| `app/utils/deadline.ts` | Works back from the titre expiry: ANEF window, last useful exam date, last booking date, daily pace |
| `app/utils/srs.ts` | Leitner boxes, intervals 1/2/4/7/14 days |
| `app/utils/plan.ts` | Today's queue, theme interleaving, streak |
| `app/utils/level.ts` | Level-check scoring: 3 items per level, pass with 2, stop at the first failed level |
| `app/data/french/level-check.json` | 36 original placement items (3 per level × 3 skills) + self-assessment statements |
| `app/composables/useStudy.ts` | Shared, persisted state (`cr10v2:*` keys) |
| `app/composables/useMorningMix.ts` · `app/utils/audio.ts` | Morning-audio playlist |
| `public/audio/*.m4a` · `app/data/audio.json` | Generated clips (macOS French voice, AAC 32 kbps) + durations |
| `public/sw.js` · `app/utils/offline.ts` | Service worker (clips cache-first with Range support, app shell network-first) and the "save for offline" helpers |
| `app/data/civic/official-cr.json` | 209 official question texts, as published (no options/answers) |
| `app/data/civic/official-cr-answers.json` | Drafted options + answer + explanation + fiche link per official question, `verified: false` until checked |
| `app/data/{civic,french}/bank.json` | Banks ported from v1: 111 civic, 52 French QCM + writing/speaking tasks |
| `scripts/` | `import-official.mjs` (re-import the official list) · `merge-drafts.mjs` (drafted answers → data) · `apply-checks.mjs` (your in-app checks → `verified`) · `port-legacy.mjs` (v1 banks → JSON) |

Deadline constants (filing 4 → 2 months before expiry, results ≤ 4 weeks, booking ~3 weeks ahead) are
typical values, not legal limits — confirm with the préfecture and the exam centre.

## Content rules

- Exam content stays in French. Item convention: `options[0]` is the correct answer; shuffled at display.
- Official questions: [formation-civique.interieur.gouv.fr](https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-cr/), Licence Ouverte / Etalab 2.0 — keep the attribution. The 12 situational questions of the exam are not published.

Re-import the official list:

```sh
curl -sSL -o /tmp/cr.html https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-cr/
pnpm import:official /tmp/cr.html
```

## Checking the drafted answers

The ministry publishes the questions only, so every option/answer for the official list is a draft
(`verified: false`), written from the official fiches and linked to the fiche it comes from.

1. In a session (or on **Official list → Show answers**), open the fiche and press
   **Matches the fiche** or **Something's wrong**. Checks are saved in the browser (`cr10v2:checks`).
2. **Settings → Export backup**, then write the checks into the data:

   ```sh
   node scripts/apply-checks.mjs ~/Downloads/cr10-backup-YYYY-MM-DD.json
   ```

   Checked answers become `verified: true`; flagged ones are listed so they can be fixed.

## Morning audio

`pnpm audio` turns every civic question (209 official + 111 from v1) and every French listening item into a clip:
question → 3-second pause → answer → explanation. It uses the macOS `say` voice (default "Thomas"; install a
better one in System Settings → Accessibility → Spoken Content → Manage Voices, e.g. "Thomas (Enhanced)", then
`pnpm audio --voice "Thomas (Enhanced)"`). Only clips whose text changed are rebuilt, so re-run it after fixing an answer.

