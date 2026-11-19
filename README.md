# GTA VI Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/slur-hunter/gta-vi-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/slur-hunter/gta-vi-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a guide in our own words that cites its sources, a seven-stage roadmap to the platinum, the one missable trophy flagged, and a checklist that saves your progress in the browser.

## What it does

- **Checklist** — tick trophies off as you earn them. Progress is saved in localStorage and can be exported to a JSON file and imported back. Count trophies (250 stunts, 42 shooting-range golds, 100 vehicles and the rest) have their own count tracker.
- **Filters** — by kind (story, strangers and side, collectibles, activities, combat and robberies, exploration, money and misc, missable, online), by grade, by earned or not earned, and free-text search. The online filter shows an honest empty state: all 55 trophies are single-player.
- **Spoiler setting** — "Hide story spoilers" hides the names and descriptions of story trophies until you earn them.
- **Roadmap** — seven stages to the platinum (story Chapters 1–2, story Chapters 3–4 and the finale, strangers and side missions, collectibles, activities, robberies combat and money, exploration and 100% completion), each showing how many of its trophies you have earned.
- **Missable page** — the one trophy that can be missed, Positive Mental Attitude, and the advice that matters: meditate at the Chapter 1 spot the moment it is offered, and keep a manual save at the start of every chapter.
- **Cited guides** — click any trophy for its guide, steps and sources. Every guide names where its facts come from: the trophy list as listed by Exophase and PSNProfiles, Rockstar's own GTA VI page, and the launch guides by KeenGamer, PowerPyx and Push Square. Where a step is reported or not yet checked in the game, the guide says so instead of inventing a method.

## An honest note about the list

Grand Theft Auto VI launches 19 November 2026 on PlayStation 5 and Xbox Series X|S. Rockstar, Sony and Microsoft had published no official trophy list before launch, and the PSNProfiles community called the circulating 55-trophy list "probably fake". This guide uses that list exactly as the kit carries it — 55 trophies, 1 platinum, 2 gold, 6 silver, 46 bronze — and each guide marks steps beyond the official description as reported or unverified. Check the list again after launch; the names, descriptions and grades will be corrected if the real list differs.

## How to run it

No build step, no network. Serve `app/` with any static server and open `index.html`:

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The app works with the network off: every file it loads lives under `app/`, and its only request is its own data file, `app/data/trophies.json`.

To hand the entry in, run the program at the root (Node 22, standard library only):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

It copies `app/` and `screenshots/` to the output directory and writes `dossier.json` there with the kit's vendored library.

## Files

- `app/index.html` — the guide's page: header, progress, filters, views and the detail pane.
- `app/app.js` — the tracker: state, localStorage progress, filters, spoiler rule, roadmap, export and import.
- `app/style.css` — the look: a bright paper theme, readable at a glance.
- `app/data/trophies.json` — all 55 trophies: official name, description and grade, kind, roadmap stage, missable flag, PSN count where one is tracked, and the guide with its steps and sources.
- `app/favicon.svg` — a small "VI" mark drawn for this guide.
- `screenshots/` — four real renders of the app in a browser: checklist, trophy detail, roadmap, filters.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.
- `serve.ts` — a tiny static server for local testing.
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.
- `shots.json` — which views the four screenshots were taken of.
- `LICENSE` — MIT.

## Not affiliated

This guide is an independent fan-made tracker, built for the make.fun bounty `gta6-trophy-guide-01`. It is not affiliated with Rockstar Games, Sony or Microsoft, and it shows no Rockstar logo, official artwork or box art.
