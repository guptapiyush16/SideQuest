# SideQuest IRL — Mobile-First PWA (MVP)

> **Core Loop:** Go outside → get a quest → do something → discover something → collect it → earn XP.  
> *"The AI isn’t trying to keep you on the screen. It gives you a reason to put the phone down."*

---

## 📱 How to Run & Install as a Mobile PWA

### 1. Run Locally
The app is currently running on **`http://localhost:3000`**.  
To restart the server at any time:
```bash
npx serve -l 3000 .
```

### 2. Install on Your Phone (PWA)
1. Ensure your phone is connected to the same Wi-Fi network as your computer.
2. Find your computer's local IP address (e.g. `192.168.1.X`).
3. Open `http://<your-computer-ip>:3000` in Safari (iOS) or Chrome (Android).
4. **iOS:** Tap the **Share** button → Tap **"Add to Home Screen"**.
5. **Android:** Tap the **Menu (⋮)** → Tap **"Install App"** or **"Add to Home screen"**.
6. The app opens full-screen like a native mobile app with offline caching powered by `sw.js`.

---

## 🌟 The 5 Core Features (Implemented)

### 1. 🎮 Daily SideQuests (Quest Master)
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
- **The Core Mechanic:** **One species = one Pokédex entry.**
  - If the user photographs a duplicate species, they see:  
    `Already discovered! 🌳 +5 XP` instead of a duplicate entry.
- **Field Guide Catalog (100 Species):**
  - Includes trees, flowers, birds, insects, fungi, rocks, and urban wildlife (*Indian Banyan, Peepal Tree, Bougainvillea, Kingfisher, Peafowl, Damselfly, etc.*).
  - Toggle between **"My Collection"** and **"Field Guide (100)"** to view locked silhouettes (`???`) and rarity stars.
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
-- 1. Profiles Table (Anonymous device ID)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
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
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quests Log
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
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
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
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

CREATE POLICY "Allow anon read/write profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write pokedex" ON pokedex_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write quests" ON quests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write adventures" ON adventures FOR ALL USING (true) WITH CHECK (true);
```
