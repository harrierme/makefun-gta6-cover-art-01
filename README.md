[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/harrierme/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/harrierme/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Lab

A cover-art maker that runs entirely offline in a desktop browser: pick a photo, choose one of six multi-panel layouts and six Vice City colour grades, write a caption, and export the cover as a PNG in Story, Square, Portrait or Wide — all four sizes in one click.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no install, no network request: the app is static files under `app/`, and the photos never leave your machine.

## How it works

- **Photos** — four sample photos ship with the app, and you can upload your own. Click a panel to select it, then pick its photo, drag inside it to reposition, and use the zoom slider.
- **Layouts** — six arrangements: Hero Split, Four Grid, Hero Left, Hero Top, Full Bleed and Tilted Trio.
- **Grades** — six colour grades: Vice Sunset, Neon Nights, Golden Hour, Noir Teal, Palm Pop and Mono Warm. Each is a photo filter plus a colour wash, vignette and grain.
- **Caption** — a title in Anton and a subtitle in Pacifico, over a dark band so the lettering reads on any photo. Every cover carries the `★ LEONIDA NIGHTS ★` badge ribbon and a thin cream frame.
- **Export** — one PNG at the selected size, or all four post sizes at once. Undo and redo are on the top bar.

## The entry

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `vendor/makefun-app.ts` library. Run it outside the grader with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The sample photos were made with an image model and are free to use. Anton and Pacifico are under the SIL Open Font License (see `app/fonts/OFL.txt`). No Rockstar Games logo, artwork or font is used.

Built for [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) on make.fun.

Optional: earn referral rewards, a second way to make money — [join make.fun with my referral link](https://make.fun/?ref=efmrhagc).
