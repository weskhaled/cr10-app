# Objectif 10 ans — cr10-app

Daily prep for the **carte de résident (10 years)**: the civic exam (CR level) and French B1 (TCF/TEF IRN).
Successor of [`carte-resident-prep`](../carte-resident-prep), which stays live as the fallback.

Nuxt 4 · Nuxt UI 4 (Reka UI + Tailwind 4) · VueUse · client-only, static output, data in `localStorage`.

## Run

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # unit tests (deadline engine, spaced repetition, daily plan)
pnpm typecheck
pnpm lint
pnpm generate     # static site in .output/public
```

## What's inside

| Path | What |
|---|---|
| `app/pages/index.vue` | **Today** — deadlines, today's reviews + new items per track, streak, last 14 days |
| `app/pages/session/[track].vue` | Study session (`civic` / `french`): due reviews first, then new items; keys 1–4 / A–D, Enter |
| `app/pages/official.vue` | The official CR knowledge-question list, searchable |
| `app/pages/settings.vue` | Expiry + exam dates, backup export/import, reset |
| `app/utils/deadline.ts` | Works back from the titre expiry: ANEF window, last useful exam date, last booking date, daily pace |
| `app/utils/srs.ts` | Leitner boxes, intervals 1/2/4/7/14 days |
| `app/utils/plan.ts` | Today's queue, theme interleaving, streak |
| `app/composables/useStudy.ts` | Shared, persisted state (`cr10v2:*` keys) |
| `app/data/civic/official-cr.json` | 209 official question **texts** (no options/answers yet) |
| `app/data/{civic,french}/bank.json` | Banks ported from v1: 111 civic, 52 French QCM + writing/speaking tasks |
| `scripts/` | `import-official.mjs` (re-import the official list) · `port-legacy.mjs` (v1 banks → JSON) |

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
