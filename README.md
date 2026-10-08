# WildDex — Production PWA

> **Core Loop:** Go outside → get a quest → do something → discover something → collect it → earn XP.  
> *"The AI isn’t trying to keep you on the screen. It gives you a reason to put the phone down."*

---

The repository contains one canonical app: the browser PWA in `index.html`, `styles.css`, `js/`, `assets/`, and the Node/Express API in `server.js`.

## 📱 How to Run & Install as a Mobile PWA

### 1. Run Locally
The app is currently running on **`http://localhost:3000`**.  
To restart the server at any time:
```bash
npm install
npm start
```

The server loads local development values from `atlas-credentials.env`. Keep that file private. For Render, configure the same variables in the service environment.

The PWA and API run from the same origin. Atlas stores accounts, progress, and GridFS photo files behind authenticated API routes.

### Managed AI deployment

Configure `OPEN_ROUTER_APIKEY` as a server-side environment variable. Do not add it to the repository, HTML, JavaScript, local storage, or a client-side build. The default model is `google/gemini-2.5-flash`; optionally override it with `OPENROUTER_MODEL` or provide `GEMINI_API_KEY`.

The PWA calls `/api/ai` for quest generation, image identification, and health checks. The server forwards requests to OpenRouter/Gemini without exposing credentials to the browser.

### MongoDB Atlas and accounts

Set these server variables:

```text
MONGODB_URI=mongodb+srv://...
MONGODB_DB=wilddex
AUTH_SECRET=long-random-secret
OPEN_ROUTER_APIKEY=...
OPENROUTER_MODEL=google/gemini-2.5-flash
GEMINI_API_KEY=...
```

Users create accounts with a unique username, password, and display name. Login requires only the username and password. Every new account starts with zero XP, an empty Pokédex, no quests, and no adventure history. Captured photos are compressed in the browser and stored in MongoDB GridFS; the database stores the associated GridFS file ID with each discovery.

The demo account created for local testing is:

```text
Email: demo@wilddex.app
```

Use the password generated during setup rather than committing it to the repository. Change or delete this account before production launch.

### 2. Install on Your Phone (PWA)
1. Ensure your phone is connected to the same Wi-Fi network as your computer.
2. Find your computer's local IP address (e.g. `192.168.1.X`).
3. Open `http://<your-computer-ip>:3000` in Safari (iOS) or Chrome (Android).
4. **iOS:** Tap the **Share** button → Tap **"Add to Home Screen"**.
5. **Android:** Tap the **Menu (⋮)** → Tap **"Install App"** or **"Add to Home screen"**.
6. The app opens full-screen like a native mobile app with offline caching powered by `sw.js`.

---

## 🌟 The 5 Core Features (Implemented)

### 1. 🎮 Daily Quests (Quest Master)
- **3 Outdoor Quests Daily:** Curated or AI-generated based on user interests, time budget (15, 30, 60 min), and location.
- **Quest Kinds:**
  - `📸 Scan`: E.g., *Nature Scout* — Find and photograph a plant you don't recognize (+50 XP).
  - `👣 Walk`: E.g., *Explorer* — Walk 1.0 km outside (+30 XP). Tracks live distance with HTML5 GPS Geolocation.
  - `👀 Observe`: E.g., *Observer* — Find something interesting you've never noticed before (+40 XP).
- **Daily Challenge:** Complete all 3 daily quests to claim **+50 XP bonus**.

### 2. 📸 AI Discovery Scanner (Field Guide AI)
- **Camera Viewfinder:** Live HTML5 environment camera stream (`navigator.mediaDevices.getUserMedia`) with HUD corners and animated laser scan beam, plus an image upload fallback.
- **Honest AI Confidence Rating:**
  - **Identified (>80% confidence):** Displays scientific classification, confidence bar (e.g., *91%*), native habitat, and a fun fact.
  - **Possible Match (<80% or close margin):** Displays ranked candidates (e.g., *1. Indian Banyan 71%*, *2. Peepal Tree 19%*, *3. Other 10%*) with a *"Try another photo"* prompt and tap-to-confirm option.
  - **Local AI Support:** Can connect to local Ollama vision models (e.g. `llama3.2-vision` / `llava`).

### 3. 📖 Your IRL Pokédex (The Stickiness Engine)
- **The Core Mechanic:** **One species = one WildDex entry.**
  - If the user photographs a duplicate species, they see:  
    `Already discovered! 🌳 +5 XP` instead of a duplicate entry.
- **Field Guide Catalog (100 Species):**
  - Includes trees, flowers, birds, insects, fungi, rocks, and urban wildlife (*Indian Banyan, Peepal Tree, Bougainvillea, Kingfisher, Peafowl, Damselfly, etc.*).
  - Browse your personal WildDex collection by category, including plants, birds, insects, flowers, fungi, rocks, and animals.
- **Species Detail Sheet:** Tap any collected species to inspect sighting timestamps, coordinates, photos, and natural history facts.

### 4. ⭐ XP + Levels (Simple RPG Math)
- **Every real-world action awards XP:**
  - Complete quest: **+30 to +100 XP**
  - Discover new species: **+50 XP**
  - Discover duplicate species: **+5 XP**
  - Daily challenge (all 3 quests): **+50 XP**
  - Walk 1 km: **+20 XP**
- **Progress:** Visual XP bar (`Level 7 · 820 / 1000 XP · Explorer`).
- **Celebration Modal:** Full-screen XP celebration modal with particle confetti on level-ups.

### 5. 🗺️ Adventure History & Journal
- **Summary Metrics:** Total distance walked (km), active minutes, discoveries made, and quests conquered.
- **Streak Tracker:** Displays daily consecutive activity streak (e.g. `🔥 3-Day Streak`).
- **Exploration Map Canvas:** Live radar map plotting the explorer's path trail and scattered discovery emoji pins based on GPS coordinates.
- **Daily Timeline Logs:** Chronological record of each day's outdoor exploration.

---

## 🤖 Multimodal AI Architecture

WildDex is built around **2 focused AI engines**:

| AI Engine | Model / Provider | Purpose |
|---|---|---|
| **1. 🎮 Quest Master** | Google Gemini / OpenRouter | Generates 3 safe, context-aware outdoor quests tailored to your available time, location, and nature interests. |
| **2. 📸 Field Guide Scanner** | Google Gemini / OpenRouter Multimodal | Classifies camera photos of plants, birds, insects, animals, and minerals with honest confidence ratings. |

---

### Managed Production AI Deployment

For production deployment, configure the server-side credentials in Render:

1. Add `OPEN_ROUTER_APIKEY` (and optionally `GEMINI_API_KEY`) to Render environment variables.
2. Set `OPENROUTER_MODEL` to `google/gemini-2.5-flash`.
3. The server provides a resilient dual-provider failover proxy at `/api/ai` so secrets remain protected.

---

### Built-in Field Guide (Zero Setup / Offline Fallback)
If network connectivity is unavailable, WildDex automatically uses its built-in deterministic taxonomy engine with **100 curated flora & fauna species** and a generative quest engine. You can use the app anywhere outdoors even with zero internet.

---

#### Option C: Built-in Field Guide (Zero Setup / Offline Fallback)
If neither Ollama nor an API key is available, WildDex automatically uses its built-in deterministic taxonomy engine with **100 curated flora & fauna species** and a generative quest engine. You can use the app anywhere outdoors even with zero internet.

---

## ☁️ Supabase Cloud Storage (Anonymous Device Identity)

### Anonymous Device Identity (No Login Required)
Each device generates a permanent unique device ID (`dev_xxxx`) stored in `localStorage`. All user data is keyed to this ID in the cloud, allowing instant access with zero friction.

### Connecting Your Supabase Project:
1. In the app, tap the **🎒 Profile** tab.
2. Scroll to **Supabase Cloud Database**.
3. Enter your **Supabase Project URL** (`https://<project-ref>.supabase.co`) and **Anon Public API Key**.
4. Click **"Save & Connect"**. The cloud status dot in the header will turn green (🟢).
5. All local progress automatically synchronizes with Supabase Postgres.

### Database Setup:
Click the **"Copy SQL Schema"** button in the app (or copy below) and paste it into the **Supabase SQL Editor** (`https://supabase.com/dashboard/project/_/sql`):

```sql
-- 1. Profiles Table (Supabase anonymous-authenticated user)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Explorer',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  interests JSONB DEFAULT '[]'::jsonb,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. IRL Pokédex Entries
CREATE TABLE IF NOT EXISTS pokedex_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  species_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scientific_name TEXT,
  category TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  rarity INTEGER DEFAULT 1,
  location_name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_data TEXT,
  photo_path TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quests Log
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  kind TEXT,
  xp INTEGER DEFAULT 30,
  status TEXT DEFAULT 'todo',
  date_key TEXT,
  completed_at TIMESTAMPTZ
);

-- 4. Adventure History
CREATE TABLE IF NOT EXISTS adventures (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  distance_km DOUBLE PRECISION DEFAULT 0,
  minutes INTEGER DEFAULT 0,
  discoveries_count INTEGER DEFAULT 0,
  quests_count INTEGER DEFAULT 0,
  path_points JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokedex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile" ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Own pokedex" ON pokedex_entries FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own quests" ON quests FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own adventures" ON adventures FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('discovery-photos', 'discovery-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users manage own discovery photos"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'discovery-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'discovery-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
```
