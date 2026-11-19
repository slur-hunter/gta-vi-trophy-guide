# GTA VI Trophy Guide

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: official names, descriptions and grades, guides written in our own words with cited sources, a roadmap to the platinum, missable flags, and a checklist saved in the browser. Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty (gta6-trophy-guide-01, $250 in USDC, 50 paid places).

## What it does

- **Tracker** — tick trophies off as you earn them; progress is saved in `localStorage`, with export to a JSON file and import back. A progress bar and per-grade counts (1 platinum, 2 gold, 6 silver, 46 bronze) sit at the top.
- **Filters** — by kind (story, missable, collectibles, activities, strangers & side, combat & robberies, exploration, money & misc, online), by grade, by earned/not earned, plus free-text search. The online filter shows an honest empty state: all 55 trophies are single-player.
- **Spoiler setting** — "Hide story spoilers" hides the names and descriptions of story trophies until you earn them.
- **Roadmap** — seven stages to the platinum, from the story (Chapters 1–4 and the finale) through strangers, collectibles, activities, robberies and money to 100% completion. Each stage shows how many of its trophies you have earned.
- **Cited guides** — click any trophy for its guide, steps and sources. Every guide names where its facts come from (the trophy list as listed by Exophase, Rockstar's own GTA VI page, KeenGamer, Output Lag and others) and says so where a step is reported or unverified instead of inventing a method.

## A note on the list — read before you trust it

GTA VI launches 19 November 2026 on PlayStation 5 and Xbox Series X|S. Rockstar, Sony and Microsoft had published **no official trophy list** before launch, and the PSNProfiles community called the circulating 55-trophy list "probably fake". This guide uses that list exactly as the kit carries it, and each guide marks steps beyond the official description as **reported** or **unverified**. Only one trophy is flagged missable — **Positive Mental Attitude**, whose Chapter 1 meditation spot is reported to disappear after the chapter, with no mission replay reported — and the roadmap tells you to keep a manual save at the start of every chapter. Check the list again after launch; the names, descriptions and grades here will be corrected if the real list differs.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No network requests: the app is plain static files under `app/`, and it works with the network off.

## Files

- `app/index.html` — the page: progress, filters, detail panel, roadmap, checklist, sources.
- `app/app.js` — rendering, filters, spoiler setting, localStorage progress, export/import.
- `app/style.css` — the look: an original deep-night neon design, no Rockstar artwork.
- `app/data/trophies.json` — all 55 trophies with official name, description and grade, plus kind, missable flag, roadmap stage, guide, steps and sources.
- `screenshots/` — 4 real renders of the app taken with headless Chromium (checklist, trophy detail, roadmap, filters).
- `main.ts` — the make.fun entrypoint: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.

## Verify it

```sh
node serve.ts            # serves app/ on http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # builds out/dossier.json
```

Check the data with Python: 55 trophies, ids 1–55, every guide non-empty with a citation, every missable trophy flagged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=slur-hunter&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
