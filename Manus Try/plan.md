# SideQuest IRL — MVP plan

## Implementation approach

Build a responsive React + TypeScript + Vite PWA with a local-first demo state. The MVP is intentionally self-contained: quests, discoveries, XP, profile memory, and adventure history are seeded in the browser so the core outdoor loop is usable immediately without an account or backend. The UI will make the AI boundaries explicit through the labels **Quest Master** and **Field Guide**; real model calls can replace the deterministic demo actions later without changing the interaction model.

The app has five primary destinations: Today (daily quests + XP), Scan (camera/file affordance + confidence-aware Field Guide result), Pokédex (collection and duplicate handling), Adventures (chronological outings), and Profile (interests and Adventure Memory). Navigation is client-side and the active destination is reflected in the URL hash. A small service worker, manifest, and installable icon make the site PWA-ready.

Required behavior preserved from the brief:

- Home opens with exactly three safe outdoor quests achievable in 10–60 minutes, each with objective, XP reward, and Start Quest action.
- Scan supports plant, flower, bird, mushroom, rock, insect, and other outdoor finds; result shows common name, scientific name, category, native region, and confidence.
- Uncertain results are labeled **Possible Match**, ranked with percentages, and offer Try another photo; uncertainty is never presented as fact.
- Pokédex stores one entry per species/object; repeat scans show **Already discovered** and award +5 XP rather than creating a duplicate.
- XP is visible for quest completion, new discoveries (+50), duplicates (+5), daily challenges (+50), and walking 1 km (+20), with level/rank/progress.
- Adventure history shows date, distance, duration, discoveries, and completed quests; maps are deferred beyond v1.
- No multiplayer, combat, social network, navigation system, custom model training, or oversized species database.

## Design direction

### Design movement
**Field-journal editorialism meets calm utility software**: the interface feels like a well-loved naturalist notebook translated into a precise mobile tool. It is warm and tactile without becoming rustic, and confident without looking gamified or noisy.

### Core principles
1. **Make the outside feel close** — large, generous typography and short copy keep the next physical action obvious.
2. **Earned, not arcade** — XP and levels are quiet progress markers, not a barrage of badges.
3. **Evidence over certainty** — scan confidence is always visible, with a calm, honest uncertainty state.
4. **Collection as memory** — Pokédex cards feel like field notes, not inventory slots.

### Color philosophy
Use warm paper `#F7F5EF` as the canvas, ink navy `#172A3A` for trust and legibility, moss `#57715A` for grounded outdoor actions, and citrus orange `#F28F3B` as the ownable SideQuest signal color. Lilac `#9B8AFB` is reserved for AI/insight moments. The palette should feel sunlit and field-tested rather than neon or childish.

### Layout paradigm
A two-zone desktop shell: a narrow vertical field-guide rail on the left and a single flowing content column on the right. On small screens, the rail compresses into a bottom dock. Avoid centered dashboard grids; use editorial blocks, offset stat cards, and left-aligned sections with a clear reading path.

### Signature elements
- A **compass-spark mark**: four small directional ticks around a central orange dot, used in the logo and AI moments.
- **Field-note cards** with thin ink rules, botanical numerals, and small all-caps labels.
- A slim **trail line** motif linking quests, XP, and history without relying on map UI.

### Interaction and animation
Tap targets should feel physical: 150–220ms lift, shadow, and orange edge on hover/press. Page changes use a short opacity/translate reveal; XP toasts slide in from the lower edge and fade after 3 seconds. Avoid looping motion. The compass-spark may rotate once when a quest starts or a scan is added.

### Typography system
Use `DM Sans` for UI, navigation, and body copy; use `Fraunces` for the occasional oversized editorial phrase and species names. All-caps labels are tracked and small, while body text remains comfortable and conversational.

### Brand essence
**A pocket field guide for people who want their real world to feel a little more discoverable.** Personality: curious, grounded, quietly bold.

### Brand voice
Headlines invite action without shouting: “Your world is bigger than your feed.” CTAs are specific and lightly playful: “Start the walk” and “Log the find.” Avoid generic onboarding filler.

### Wordmark & logo
The wordmark is set beside the compass-spark, with the orange center dot representing the next thing worth noticing. The mark appears as a reusable SVG icon for the favicon, PWA icon, sidebar, and scan state.

### Signature brand color
**SideQuest Citrus** `#F28F3B` — a bright, ownable orange that reads as sunlight, signal, and forward motion against the paper canvas.

## Project structure

- `index.html` — document shell, metadata, manifest link, font loading.
- `src/main.tsx` — React entry point, service worker registration.
- `src/App.tsx` — client-side navigation, seeded MVP state, page composition, interactions.
- `src/styles.css` — responsive field-journal visual system and component styling.
- `public/manifest.webmanifest` — installable PWA metadata and icon references.
- `public/sw.js` — lightweight offline shell/cache strategy.
- `public/sidequest-mark.svg` — reusable compass-spark mark.
- `public/manus-routes.json` — route manifest for the managed preview.
- `app.config.ts` — managed project logo metadata.
- `TODO.md` — outcome-based acceptance clauses carried from the brief.

## Serving and dependencies

Use Vite on the managed runtime port 3000, binding to `0.0.0.0`. The frontend is static and does not need server/database capabilities for this MVP. `pnpm install` and `pnpm build` are the clean build path; the build output is `dist`. The preview is the canonical verification surface; no API keys or external model credentials are required for the demo state.
