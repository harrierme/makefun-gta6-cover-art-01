# makefun-gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/harrierme/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/harrierme/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Lab — a web app that turns a person's photo and a caption into
GTA 6-style cover art (multi-panel poster, bold lettering, Vice City
sunset / neon grade), exported as PNG in post sizes. In Node 22 standard
library only, and 100% offline: every script, image and font it loads is
a file under `app/`.

## What it does

- **Your photos, your cover.** Load photos from your machine (nothing is
  uploaded) or start from the four sample photos shipped in
  `app/samples/` — Boulevard, Pier, Rooftop and Neon Street.
- **6 layouts** — Hero + 3, Nine-Panel Grid, Full Bleed, Tilted Snapshots,
  Duo Split (two large side-by-side panels + title band) and Film Strip (a
  strip of four small panels over one large hero).
- **6 colour grades** — Vice Sunset, Neon Night, Palm Gold, Teal Heat,
  Bubblegum and Mono Noir (high-contrast black-and-white, silver band).
- **4 post sizes** — Square 1080 x 1080, Portrait 1080 x 1350, Wide
  1920 x 1080 and Story 1080 x 1920. **Export all sizes** downloads the
  current cover in all four sizes with one click.
- **Badge ribbon** — a diagonal ribbon across the top-right corner with
  the invented label “LEONIDA NIGHTS” and a star, toggleable from the
  editor. All lettering and art is original.
- **Editor** — click a panel to select it, drag to position its photo,
  zoom it, pick which photo each panel shows, undo / redo, and a live
  preview drawn at export size. Title in bold Anton capitals, subtitle in
  Pacifico script, halftone title block, five-star heat meter, film grain
  and vignette.
- **Screenshot scenes** — `?shot=editor` shows the editor with photos
  loaded; `?shot=cover` shows one exported cover alone. Knobs: `layout`,
  `grade`, `size`, `title`, `subtitle`, `photo`, `badge`. See `shots.json`.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=efmrhagc&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

## What it is

`main.ts` hands the app in: it copies this repository's `app/` and
`screenshots/` to `/output` and writes `/output/dossier.json` with the
vendored make.fun library's buildDossier. Serve the app locally with
`node serve.ts`, then open http://localhost:8080.

Fonts: Anton, Pacifico and Bebas Neue, vendored as TTFs under
`app/fonts/` under the SIL Open Font License — see `app/fonts/OFL.txt`.
No Rockstar Games logo, artwork, character or font is used anywhere.

## License

MIT — see `LICENSE`.
