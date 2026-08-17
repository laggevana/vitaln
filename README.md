# Vital N Guide (YouTube-hosted)

An interactive, single-page guide to using Vital N Plus biofertilizer, built for the Vital N Application Guide research project. This version streams every video from YouTube instead of hosting local `.mp4` files.

## Purpose

This is a parallel version of the [`vital-n-guide`](https://github.com/laggevana/vital-n-guide) repository, created to test whether streaming video from YouTube's CDN resolves the slow/inconsistent loading experienced when hosting video files directly on GitHub Pages. The two repos are kept independent so the original (local-file) version stays untouched while this one is evaluated.

- **`vital-n-guide`** — original version, videos served as local `.mp4` files from `assets/videos/` and `assets/audio/`
- **`vitaln`** (this repo) — videos are embedded via the YouTube IFrame Player API; no video files are stored in the repo

## How video playback works here

Every video element in `index.html` is a small `<div>` placeholder that the YouTube IFrame API replaces with a live player at runtime (see `window.onYouTubeIframeAPIReady` in `app.js`). All interactive behavior that previously relied on the native `<video>` element — step click-to-seek, timed button-nudge cues, step highlighting, "watched fully" tracking for the completion celebration — is reimplemented against YouTube's Player API (`seekTo`, `playVideo`, `getCurrentTime` polling, `onStateChange`) instead of native video events.

### Video IDs in use

| Screen | YouTube ID |
|---|---|
| Welcome / intro | `Yx295QTOyw8` |
| Crop selection prompt | `J9mEgaHc2sc` |
| Rice method prompt | `DvQ6T6QFu8k` |
| Palay: Buto | `rPlBRyoWGfc` |
| Palay: Dapog | `POAlM1mhih4` |
| Mais | `S4mlJ65Z544` |
| Sibuyas | `Hp6B-MxKHOc` |
| Completion video | `rQN6bsDoLEc` |

All videos are uploaded as **Unlisted** on YouTube — playable via direct link/embed, not publicly searchable. To swap a video, replace its ID in the `YT_IDS` object at the top of `app.js`.

## Running locally

No build step. Serve the folder with any static file server (e.g. `python3 -m http.server`) and open it in a browser — opening `index.html` directly via `file://` will not work, since the YouTube IFrame API requires a real HTTP(S) origin.
