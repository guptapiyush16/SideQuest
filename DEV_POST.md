# WildDex: The Real-World Field Guide & IRL Pokédex Powered by Gemma & Render

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

---

## What I Built

Most modern apps are designed to trap your attention on glass. Infinite feeds, notification loops, and algorithmic recommendations reward you for staying inside and scrolling.

**WildDex** (formerly SideQuest IRL) flips that incentive on its head. It is an installable, mobile-first Progressive Web App (PWA) designed with one core thesis:

> *"The AI isn’t trying to keep you on the screen. It gives you a reason to put the phone down and touch grass."*

### 🌿 The Core Loop:
1. **🎮 Pick a Daily Quest:** Every morning, the AI **Quest Master** analyzes your local surroundings, interests (trees, birds, insects, flowers, urban wildlife), and available time (15, 30, or 60 min) to generate 3 safe, grounded outdoor quests:
   - `📸 Scan`: Find and photograph a specific specimen you don't recognize.
   - `👣 Walk`: Step outside for a 1.0 km mindful walk with live GPS tracking.
   - `👀 Observe`: Notice subtle patterns or seasonal changes in your neighbourhood.
2. **📸 AI Discovery Scanner:** When you spot something intriguing outside, open the viewfinder. The multimodal AI model analyzes the specimen, provides an honest confidence score (e.g., *Golden Retriever 99%* or *Indian Banyan 91%*), native habitat notes, and natural history field facts.
3. **📖 Your Real-World Pokédex:** Every unique species you spot is deduplicated and added to your personal Pokédex catalog. Duplicate finds reward you with bonus XP for revisiting familiar nature (`Already discovered! 🌳 +5 XP`).
4. **⭐ Level Up in Real Life:** Walk kilometers, complete quests, and spot rare species to earn XP, level up your explorer badge (from *Junior Scout* to *Apex Trailblazer*), and maintain your daily outdoor exploration streak.
5. **🗺️ Trail Log & Adventure Map:** Tracks distance walked, active outdoor minutes, and pins your discoveries along a live radar breadcrumb trail.

WildDex is built for everyday walkers, nature enthusiasts, families, and anyone suffering from digital fatigue who wants a fun, playful RPG reason to step outdoors every day.

---

## Demo

- 🌐 **Live Web App (Production on Render):** [https://sidequest-0kzp.onrender.com](https://sidequest-0kzp.onrender.com)
- 📱 **Mobile PWA Ready:** Open the link on iOS Safari or Android Chrome, tap **"Add to Home Screen"**, and WildDex installs as a full-screen standalone app with offline service worker caching.

---

## Code

WildDex is 100% open-source under the MIT license:

{% github guptapiyush16/SideQuest %}

🔗 **Repository:** [https://github.com/guptapiyush16/SideQuest](https://github.com/guptapiyush16/SideQuest)

---

## How I Built It

WildDex combines modern local-first PWA design, open-weight AI inference, and cloud persistence:

### 1. 🤖 Open-Weight AI Architecture (Google Gemma & PaliGemma)
The project is built around **two focused AI engines**:
- **🎮 Engine #1 — Quest Master (Google Gemma 2):** Uses `gemma2:2b` or `gemma2:9b` to generate structured JSON quests strictly bounded by safety guidelines (no private property, no touching wildlife, realistic outdoor walking distances).
- **📸 Engine #2 — Field Guide Scanner (Google PaliGemma & Gemini):** Multimodal vision model that classifies camera photos with honest uncertainty estimation. Rather than guessing blindly, the model provides ranked candidate distributions and field notes.
- **Privacy & Offline First:** Users can run Gemma **100% locally and offline** by connecting the app to a local [Ollama](https://ollama.com) instance (`ollama pull gemma2:2b`, `ollama pull paligemma`). If you're on a trail with zero cell reception, WildDex also includes a deterministic taxonomy engine with 100 curated species and offline Service Worker caching.

### 2. ⚡ Production Runtime on Render
Render powers the entire production lifecycle:
- A unified Node.js / Express web service specified in `render.yaml`.
- Hosts the PWA client, serves the backend API, and provides a secure server-side `/api/ai` proxy so user API keys and credentials are never exposed in browser bundles.
- Automatic continuous deployment connected directly to GitHub `main` branch with health check monitoring at `/api/health`.

### 3. 🍃 Data & Media Layer on MongoDB Atlas
- **User Accounts & Progression:** Managed with secure JWT authentication and bcrypt password hashing.
- **Pokédex & Quest Sync:** Tracks unique species IDs, duplicate sighting counts, and GPS coordinates.
- **MongoDB GridFS Bucket (`photos`):** Captured field photos are compressed client-side (HTML5 Canvas down to 1200px at ~200KB) and streamed into MongoDB GridFS binary storage, keyed directly to the user's discovery ID.

### 4. 💻 Built with GitHub Copilot
- Leveraged the **GitHub Copilot coding agent** in the terminal to architect the PWA service worker caching strategy, refactor the dual-provider AI failover proxy, and optimize client-side image compression pipelines.

---

## Why Does Open Innovation Matter?

When AI models are locked behind proprietary, black-box cloud APIs, exploring outdoors becomes fragile:
1. **Zero-Signal Trails & Off-Grid Privacy:** Nature happens outside city cellular bubbles. When you're in a national park or dense forest trail, a closed cloud API simply fails. Open-weight models like **Google Gemma** allow inference to run right on local laptops, edge devices, or local networks with Ollama without sending personal location data or photos to centralized servers.
2. **Cost-Effective Educational Software:** Outdoor education should be accessible to students and community naturalists worldwide. Open models enable developers to build engaging real-world games without incurring crippling per-token cloud costs.
3. **Inspectable & Safe Behavior:** Using open-weight models allows developers to audit, constrain, and fine-tune safety boundaries directly—ensuring an AI Quest Master never encourages reckless exploration or dangerous foraging.

---

## My Agent Session

This application was developed and iterated using **GitHub Copilot's coding agent** and terminal workflow. Copilot was utilized to:
- Scaffold the `render.yaml` infrastructure-as-code configuration.
- Implement the client-side canvas photo compression pipeline to keep mobile uploads lean.
- Diagnose and resolve multimodal response parsing and error failovers across direct and proxy endpoints.

*(Agent session logs and commits are visible directly in the [commit history of the GitHub repository](https://github.com/guptapiyush16/SideQuest/commits/main)).*

---

## Prize Categories

### 🌟 Featured Categories:
- **Best Use of Render ($200 USD):** Render hosts our unified production Node.js environment, serves the PWA front-end, manages zero-downtime CI/CD from GitHub, and acts as the secure AI runtime proxy (`render.yaml`).
- **Best Use of Gemma ($200 USD):** Gemma is the core brain of WildDex. We use open-weight **Gemma 2** (`gemma2:2b`) for dynamic quest generation and multimodal **PaliGemma** (`paligemma`) for camera specimen classification, supporting both local offline Ollama inference and managed cloud serving.

### 🤝 Partner Categories:
- **Best Use of MongoDB Atlas ($100 USD):** MongoDB Atlas powers the entire database layer—persisting explorer profiles, real-world Pokédex entries, XP progression, and storing captured discovery photos via a dedicated **MongoDB GridFS Bucket**.
- **Best Use of GitHub Copilot ($100 USD):** Developed with the GitHub Copilot CLI and coding agent, accelerating PWA manifest configuration, AI error-resilience refactors, and full-stack API integration.

---

*Go outside, take a walk, look closer at the world around you, and start filling your WildDex! 🌿🎒*
