# PixelLove

A cozy, pastel, pixel-arcade-style app for a long-distance couple (Thorunn and Dylan). It's a home-screen web app (PWA) hosted on GitHub Pages, with Firebase for sign-in, data, push notifications and the notification sender.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The whole app: HTML, CSS and JS in one file. This is what gets edited most. |
| `config.js` | Firebase web config and VAPID key (`self.FIREBASE_CONFIG`, `self.VAPID_KEY`). Not secret. Loaded as `config.js?v=N` in `index.html` and `firebase-messaging-sw.js`; bump `N` in both whenever it changes so phones don't keep an old copy. |
| `firebase-messaging-sw.js` | Service worker that receives push notifications. |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png` | Home-screen app metadata and pixel-goldfish icons. |
| `firebase/firestore.rules` | Locks all data to the two allowed emails (`isUs()`). |
| `firebase/functions/index.js` | Cloud Functions (v2) that send pushes, plus a 10-minute schedule for bottles washing up and a hungry pet. |
| `firebase/functions/.env` | `APP_URL` (GitHub Pages address, trailing slash). |
| `widget/pixellove-widget.js` | iPhone home-screen widget for the Scriptable app. Signs in with the Firebase Auth REST API (refresh token in Keychain) and reads Firestore REST. Keep its field names in sync with the app. |
| `SETUP.md` | User-facing setup guide. Keep it in sync when setup steps change. |

The app files sit at the repository root, and GitHub Pages serves them from there. Firebase files live in `firebase/`, which is just stored alongside the app. Never commit `node_modules` (see `.gitignore`).

`firebase/firestore.rules` in this public repository keeps placeholder emails on purpose. The real rules, with the two real emails, live only in the Firebase console, so don't deploy rules from this copy without putting the real emails in first.

## How the data layer works

The app code was first written for a host that exposes `window.claude.use('db' | 'user' | 'assets')`. In this version, a small bridge in `<head>` defines `window.claude.use()`, and a `<script type="module">` at the end of `index.html` resolves it with Firebase-backed objects once the user signs in:

- `db.doc(path)` / `db.collection(path)` support `get`, `set`, `update`, `delete`, `onSnapshot`, `where`, `orderBy`, `limit` and `add`, and wrap Firestore with the same snapshot shapes (`exists`, `data()`, `docs`, `docChanges()`, `metadata`).
- `user.id()` returns the Firebase Auth uid. `user.profiles(ids)` reads `users/{uid}.name`.
- `assets.upload(blob)` compresses images to a JPEG data URL (under about 900 KB) and returns `{id, url}`. Photos are stored inline in Firestore documents because Firebase Storage needs the Blaze plan.

Keep this interface stable. Most features call `db`, `add`, `setDoc`, `upd` and `delDoc` and never touch Firestore directly.

### Firestore collections

`shared/settings` (names, time zones, visit date, `since`, `sideA`/`sideB` uids, theme, fish looks), `shared/pet`, `shared/tank` (owned items, placed decor, water, sand, outfit, food counts), `shared/pick`, `coins/{uid}` (earned, spent, daily `done`, `days` for streaks, `stats` counters, `bonus`), `profiles/{uid}`, `locations/{uid}` (home and live), `users/{uid}`, `pushTokens/{uid}`, plus list collections `taps`, `notes`, `bottles`, `photos`, `ideas`, `songs/{uid}`, `moods/{uid}`, `nights/{uid}`.

P1 and P2 are decided by `settings.sideA` / `settings.sideB` (set in "Our details" under "Which one are you?"). The `sides()` helper falls back sensibly when those are unset.

## Features (search `index.html` for these comment headers)

Home: countdown, hug/kiss/miss buttons (fish swim together and bump noses), live clocks with P1/P2 labels and titles, time-of-day water, seasons, "Our skies" (place name from live location or home pin via Nominatim reverse lookup, else the time zone city), "Our map" (Leaflet + OpenStreetMap, Nominatim search, home pins, live location via `watchPosition`), mood weather with full-screen effects, goodnight night mode, pixel bonsai that grows with days together, anniversary banner.
Pet: pixel goldfish in a pixel bowl. Hunger, happiness and cleanliness decay from timestamps. Three foods with an inventory. A treat-catching play game. The bowl gets visibly dirty. Tank shop (decor, plants, water, sand, outfits, fish looks, food). Daily tasks and a shared coin wallet.
Prize machines (gacha, on the Pet screen): four machines (furniture, clothing, color palettes, fish types), 25 coins a pull, rarities Rare 62% / Ultra rare 27% / Legendary 9% / Ultimate 2%, pity guarantees Legendary+ after 15 pulls (`tank.pity`), duplicates refund coins. Pools live in `GACHA`; fish types are `shape-*` items whose sprites are `<g id="f…">` in `<defs>` and need a `PIXACC[acc][shape]` entry for every outfit (generated, `PIXACC_V3`); prizes are `ITEMS` entries; palette effects (`PAL_FX`: galaxy, sunset, rainbow, aurora, holo) animate the registered `--fb`/`--ff` properties.
Love: message in a bottle, love notes (letter paper), song of the day with Spotify / Apple Music links and an in-app player (official embeds, `embedUrl()`).
Memories: photo wall (polaroids). Dates: in-person date ideas with a spin wheel. Badges: love streak and 18 achievements. Profiles: avatar (optional pixel filter), name, about line, title unlocked by achievements, stats.
App-wide: arcade theme, love meter, chiptune sounds (toggle), sparkles and confetti, loading screen, customizable app colors and fish (shapes, colors and outfits bought with coins).

## Style conventions

- Pastel arcade look. Pixel borders use the four-way `box-shadow` trick (`--pxb`, `--pxs`). Square corners, the "Pixelify Sans" font for UI and headings, Nunito for body text and Gaegu for handwriting.
- All fish, the pet bowl, decorations, outfits, icons and the bonsai are pixel art drawn as `<rect>` runs with `shape-rendering="crispEdges"`. Fish colors come from CSS variables `--fb` (body), `--ff` (fins) and `--fs` (outline).
- Respect `prefers-reduced-motion`. Most motion is already gated on `reduce`.
- No dark mode: the app is always light and pastel.
- UI text is warm, short and sentence case (headings are uppercased by CSS).

## Testing

There's no build step. To test locally, serve `site/` (for example `python3 -m http.server`), or stub Firebase by routing the `gstatic.com/firebasejs/*` imports to small mock modules (an in-memory Firestore) in a headless browser. Check the main inline `<script>` with `node -e "new Function(src)"` and the module script with `node --check` after edits.

## Deploying

- App changes: commit the changed app files at the repository root, and GitHub Pages updates within a couple of minutes.
- Functions changes: from `firebase/functions`, run `npm install`, then from `firebase/`, run `firebase deploy --only functions --project fishies-14ec2`. Functions need the Blaze plan and Node.js 22.
- Rules changes: edit them in the Firebase console, or deploy from a local copy that has the real emails.
