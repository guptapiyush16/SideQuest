# WildDex: An IRL Pokédex That Actually Makes You Touch Grass

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

---

## What I Built

Most apps are engineered to maximize your screen time. Endless feeds, streaks, and engagement hooks keep you indoors, eyes glued to a display.

**WildDex** does the exact opposite. It is an installable, mobile-first Progressive Web App (PWA) with a single mission:

> *"The AI isn’t trying to keep you on the screen. It gives you a reason to put the phone down and touch grass."*

### 🌿 The Core Loop:
1. **🎮 Daily Quests (Quest Master):** Every morning, the AI **Quest Master** analyzes your local city, interests (trees, birds, insects, flowers, domestic animals, minerals), and time budget (15, 30, or 60 min) to generate 3 safe outdoor quests:
   - `📸 Scan`: Find and photograph a specific specimen you haven't seen today.
   - `👣 Walk`: Take a 1.0 km walk with live HTML5 GPS distance tracking.
   - `👀 Observe`: Notice a subtle detail or seasonal shift in your neighbourhood.
2. **📸 AI Discovery Scanner:** When you spot something intriguing outside (a plant, bird, insect, mushroom, rock, or dog), open the camera viewfinder. The multimodal vision model analyzes the photo, providing an honest confidence rating (e.g., *Golden Retriever 99%* or *Indian Banyan 91%*), native habitat details, and natural history field facts.
3. **📖 Your Real-World Pokédex:** Every unique species is deduplicated and permanently cataloged. Photographing familiar species rewards bonus XP for revisiting local nature (`Already discovered! 🌳 +5 XP`).
4. **⭐ Level Up in Real Life:** Complete quests and document real-world biodiversity to earn XP, level up your explorer rank (from *Junior Scout* to *Apex Trailblazer*), and build consecutive daily outdoor streaks.
5. **🗺️ Trail Log & Adventure Map:** Tracks distance walked, active minutes, and plots your sightings on a live radar breadcrumb trail.

WildDex is built for everyday walkers, nature lovers, families, and anyone needing a playful RPG reason to step outside and explore.

---

## Demo

- 🌐 **Live Web App (Hosted on Render):** [https://sidequest-0kzp.onrender.com](https://sidequest-0kzp.onrender.com)
- 📱 **Mobile PWA Ready:** Open the link in iOS Safari or Android Chrome, select **"Add to Home Screen"**, and WildDex launches as an installable standalone app with offline service worker caching.

---

## Code

WildDex is 100% open-source under the MIT license:

{% github guptapiyush16/SideQuest %}

🔗 **Repository:** [https://github.com/guptapiyush16/SideQuest](https://github.com/guptapiyush16/SideQuest)

---

## How I Built It

WildDex combines a modern local-first PWA, a resilient dual-provider AI pipeline, and production cloud infrastructure:

### 1. 🤖 Resilient Multimodal AI Architecture
WildDex powers its core experience through two dedicated server-side AI engines:
- **🎮 Quest Master Engine:** Dynamically constructs structured, context-aware quests strictly bounded by safety guidelines (public parks, no trespassing, realistic walking targets).
- **📸 Field Guide Vision Scanner:** Multimodal AI model that classifies camera photos with honest uncertainty estimation. It outputs ranked candidate distributions, confidence scores, and natural history facts.
- **Dual-Provider Resilience:** Implemented a zero-downtime failover pipeline in Node.js (`api/ai.js`). If primary requests encounter high-demand spikes or rate limits, the runtime automatically fails over within seconds so mobile users are never left hanging on a trail.

### 2. ⚡ Production Runtime on Render
Render powers the entire production lifecycle:
- A unified Node.js / Express web service declared via infrastructure-as-code in `render.yaml`.
- Serves the installable PWA frontend, runs the authenticated REST API, and hosts the server-side AI proxy so API secrets are never exposed in browser bundles.
- Automatic continuous deployment connected directly to GitHub `main` with health check monitoring at `/api/health`.

### 3. 🍃 Data & Media Layer on MongoDB Atlas
- **User Accounts & Progression:** Managed with secure JWT authentication and bcrypt password hashing.
- **Pokédex & Quest Sync:** Stores unique species entries, duplicate sighting counts, and GPS coordinates.
- **MongoDB GridFS Bucket (`photos`):** Captured field photos are compressed client-side (HTML5 Canvas down to 1200px at ~200KB) and streamed into MongoDB GridFS binary storage, linked directly to the user's discovery record.

### 4. 💻 Engineered with GitHub Copilot
- Leveraged the **GitHub Copilot coding agent** and CLI in the terminal to scaffold PWA manifest configurations, architect the GridFS upload pipeline, and optimize client-side image compression routines.

---

## Why Does Open Innovation Matter?

When technology is open and accessible, it empowers people to engage with the physical world instead of remaining trapped in walled gardens:
1. **Open Web Standards Over App Store Walled Gardens:** Built as an open Progressive Web App (PWA) using HTML5, Vanilla CSS, and Service Workers. Anyone on iOS or Android can install it immediately without app store gatekeepers, fees, or downloads.
2. **Accessible Outdoor Education:** Nature education should be available to everyone—students, park visitors, and community naturalists. Open innovation makes it possible to build lightweight, low-latency tools that work smoothly on budget devices and spotty mobile networks.
3. **Transparent Science & Honest AI:** Rather than pretending to be 100% omniscient, our open prompts demand transparent confidence distributions and field notes, encouraging explorers to verify observations and stay curious.

---

## My Agent Session

This application was developed and iterated using **GitHub Copilot's coding agent** and terminal workflow. Copilot was used to:
- Write and validate the `render.yaml` infrastructure-as-code specification.
- Construct the client-side canvas compression pipeline to ensure fast, reliable mobile photo uploads.
- Refactor the server-side AI failover proxy and MongoDB GridFS image streaming handlers.

*(Session commits and architectural iterations are documented in the [commit history of the GitHub repository](https://github.com/guptapiyush16/SideQuest/commits/main)).*

---

## Prize Categories

### 🌟 Featured Categories:
- **Best Use of Render ($200 USD):** Render serves as our complete production runtime. Declared via `render.yaml`, it hosts the Node.js/Express service, serves the mobile PWA frontend, runs the secure AI runtime proxy, and automates zero-downtime GitHub deployments.

### 🤝 Partner Categories:
- **Best Use of MongoDB Atlas ($100 USD):** MongoDB Atlas powers the persistent database layer—handling user authentication, Pokédex collections, XP progression, and storing captured discovery photos via a dedicated **MongoDB GridFS Bucket**.
- **Best Use of GitHub Copilot ($100 USD):** Developed using the GitHub Copilot CLI and coding agent, accelerating infrastructure setup, PWA offline caching, and full-stack API integration.

---

*Go outside, take a walk, look closer at the world around you, and start filling your WildDex! 🌿🎒*
