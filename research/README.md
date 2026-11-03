# Research material

- `fiches.json` / `fiches.txt` — text of the 227 official revision fiches of
  [formation-civique.interieur.gouv.fr](https://formation-civique.interieur.gouv.fr/),
  Licence Ouverte / Etalab 2.0. Refresh with `node scripts/fiches/fetch.mjs <cache-dir>`.
- `drafts/<theme>.json` — drafted options/answers for the official questions, one file per theme,
  checked with `node scripts/fiches/check-drafts.mjs <theme>` and merged into the app data with
  `node scripts/merge-drafts.mjs` (every merged answer starts as `verified: false`).

Search the fiches: `node scripts/fiches/search.mjs "<query>"` or `--pack <theme>` for a whole theme.
