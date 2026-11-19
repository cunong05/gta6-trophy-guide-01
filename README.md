# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/cunong05/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/cunong05/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Vice Platinum Guide** — an offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5: the official list with names, descriptions and grades, a checklist saved in the browser, filters by kind and grade, a spoiler-safe mode, a roadmap to the platinum, the one missable trophy flagged, and a guide to each trophy in the author's own words that cites its sources.

## What it is

- **Every trophy, verified.** All 55 official trophies (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 hidden) with the names, descriptions and grades as PlayStation publishes them — checked live on 19 November 2026 against Exophase and PSNProfiles, which agree on every name, description and grade.
- **A tracker, not just a list.** Tick trophies off; progress is saved in localStorage with a progress bar and per-grade counts, and can be exported to JSON and imported back.
- **Filters that matter.** By kind (story, side stories, collectibles, activities, crime, money, exploration), by grade, by earned/unearned, by missable-only, plus text search.
- **Spoiler-safe mode.** Hides the names and descriptions of hidden story trophies until you earn them.
- **Roadmap to the platinum.** Four stages — story, side stories, activities & crime, collectibles & cleanup — built from the official descriptions, with the save rules that protect a run (no mission replay, chapter saves, no cheats on the trophy save).
- **One missable trophy, flagged.** Positive Mental Attitude — Lucia's balcony meditation in Chapter 1 disappears after that chapter. Everything else stays available after the credits.
- **Cited guides.** Every trophy's guide is written in the author's own words and names its sources beside the guide (Exophase for the official list, PSNProfiles for PSN's counts, Output Lag for specific how-to facts). Where a method is not yet confirmed in the game, the guide says so plainly instead of guessing.
- **Offline by design.** Static files under `app/` with no build step and no network requests at run time. No Rockstar logo or artwork; the look is original.

## Run it

```sh
cd app && python3 -m http.server 8080
```

Then open http://localhost:8080 in a desktop browser. (Any static server works; the app must be served over HTTP because it loads `data/trophies.json`.)

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`.

## Layout

- `main.ts` — entry program, hands the guide in
- `app/index.html`, `app/app.js`, `app/style.css` — the guide
- `app/data/trophies.json` — the 55 trophies with guides, steps, kinds, roadmap stages and sources
- `screenshots/` — 4 real renders of the app (list, trophy detail, roadmap, spoiler mode)
- `vendor/makefun-frontend.ts` — make.fun dossier library, unchanged from the kit

## Sources

- Exophase — GTA VI trophies: https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — Grand Theft Auto VI trophies: https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- Output Lag — GTA 6 Trophy List: https://outputlag.com/guides/gta-6-trophy-list/
- KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap: https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/

An independent fan guide — not affiliated with Rockstar Games.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
