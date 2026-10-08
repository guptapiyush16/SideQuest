// 🧠 AI #1 — Quest Master: Generates 3 safe outdoor quests for WildDex
// Achievable in 10-60 minutes, tailored to interests, available time and past history.

export const QUEST_POOL = [
  {
    emoji: '🌳',
    title: 'Nature Scout',
    description: "Find and photograph a plant or tree you don't recognize.",
    kind: 'scan',
    minutes: 20,
    xp: 50,
    tags: ['plants', 'trees', 'nature']
  },
  {
    emoji: '🚶',
    title: 'Explorer',
    description: 'Walk 1 km outside and explore your surroundings.',
    kind: 'walk',
    targetKm: 1.0,
    minutes: 15,
    xp: 30,
    tags: ['walking', 'movement']
  },
  {
    emoji: '👀',
    title: 'Observer',
    description: "Find something interesting in your neighbourhood you've never noticed before.",
    kind: 'observe',
    minutes: 10,
    xp: 40,
    tags: ['mindfulness', 'curiosity']
  },
  {
    emoji: '🐦',
    title: 'Bird Spotter',
    description: 'Scan and identify any wild bird perched or foraging outdoors.',
    kind: 'scan',
    minutes: 25,
    xp: 60,
    tags: ['birds', 'wildlife']
  },
  {
    emoji: '🌸',
    title: 'Color Hunter',
    description: 'Discover and photograph a vibrant wild or garden flower.',
    kind: 'scan',
    minutes: 20,
    xp: 50,
    tags: ['flowers', 'colour']
  },
  {
    emoji: '🧭',
    title: 'New Path',
    description: 'Walk 1.5 km and take at least one street or path you usually avoid.',
    kind: 'walk',
    targetKm: 1.5,
    minutes: 25,
    xp: 45,
    tags: ['walking', 'adventure']
  },
  {
    emoji: '🦋',
    title: 'Tiny World',
    description: 'Look closely at bark, soil, or petals to discover and photograph an insect.',
    kind: 'scan',
    minutes: 20,
    xp: 70,
    tags: ['insects', 'macro']
  },
  {
    emoji: '🎧',
    title: 'Sound Map',
    description: 'Stand still outdoors with eyes closed for 3 minutes and count 5 distinct natural sounds.',
    kind: 'observe',
    minutes: 10,
    xp: 40,
    tags: ['mindfulness', 'sound']
  },
  {
    emoji: '🪨',
    title: 'Stone Reader',
    description: 'Find an unusual mineral, pebble, or rock texture and photograph it.',
    kind: 'scan',
    minutes: 15,
    xp: 40,
    tags: ['rocks', 'geology']
  },
  {
    emoji: '🌅',
    title: 'Sky Watch',
    description: 'Find an open vantage point and observe the horizon clouds or sunset for 10 minutes.',
    kind: 'observe',
    minutes: 15,
    xp: 50,
    tags: ['mindfulness', 'sky']
  },
  {
    emoji: '🍄',
    title: 'Fungi Hunter',
    description: 'Search shaded tree bases or decaying wood for mushrooms or lichen.',
    kind: 'scan',
    minutes: 30,
    xp: 80,
    tags: ['fungi', 'shaded']
  },
  {
    emoji: '🏃',
    title: 'Trailblazer',
    description: 'Complete a brisk 2 km outdoor loop through a nearby park or garden.',
    kind: 'walk',
    targetKm: 2.0,
    minutes: 30,
    xp: 60,
    tags: ['walking', 'stamina']
  }
];

function getLocalDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function generateDailyQuests({ 
  interests = [], 
  minutes = 30, 
  locationName = '', 
  aiSettings = { mode: 'offline', ollamaUrl: 'http://localhost:11434', gemmaModel: 'gemma2:2b' }
} = {}) {
  const mode = aiSettings?.mode || 'offline';

  // 1. Google Gemini / Gemma Cloud API
  if (mode === 'google-api') {
    try {
      const quests = await generateQuestsFromGoogleApi({
        interests,
        minutes,
        locationName
      });
      if (quests && quests.length === 3) {
        return { quests, source: 'google-api' };
      }
    } catch (e) {
      console.warn('Google API quest generation failed, falling back to curated:', e.message);
    }
  }

  // 2. Local Google Gemma via Ollama
  if (mode === 'gemma-local' && aiSettings?.ollamaUrl) {
    try {
      const quests = await generateQuestsFromOllamaGemma({ 
        interests, 
        minutes, 
        locationName, 
        ollamaUrl: aiSettings.ollamaUrl,
        model: aiSettings.gemmaModel || 'gemma2:2b'
      });
      if (quests && quests.length === 3) {
        return { quests, source: 'gemma-local' };
      }
    } catch (e) {
      console.warn('Ollama Gemma quest generation failed, falling back to curated:', e.message);
    }
  }

  // 3. Generative curated selection (High-quality offline fallback)
  const allowed = QUEST_POOL.filter(q => q.minutes <= Math.max(minutes, 15) + 10);
  const byKind = {
    scan: allowed.filter(q => q.kind === 'scan'),
    walk: allowed.filter(q => q.kind === 'walk'),
    observe: allowed.filter(q => q.kind === 'observe')
  };

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const selected = [
    pickRandom(byKind.scan.length ? byKind.scan : QUEST_POOL.filter(q => q.kind === 'scan')),
    pickRandom(byKind.walk.length ? byKind.walk : QUEST_POOL.filter(q => q.kind === 'walk')),
    pickRandom(byKind.observe.length ? byKind.observe : QUEST_POOL.filter(q => q.kind === 'observe'))
  ];

  const dateKey = getLocalDateKey();
  const questsWithIds = selected.map((q, idx) => ({
    ...q,
    id: `quest_${dateKey}_${idx}`,
    status: 'todo',
    dateKey
  }));

  return { quests: questsWithIds, source: 'curated' };
}

async function generateQuestsFromOllamaGemma({ interests, minutes, locationName, ollamaUrl, model = 'gemma2:2b' }) {
  const prompt = `You are the Quest Master for the outdoor exploration game "WildDex". 
Generate exactly 3 safe, fun outdoor quests for an explorer in ${locationName || 'their local city'}.
Available time: ${minutes} minutes.
Interests: ${interests.join(', ') || 'general nature, walking'}.
Rule: Exactly 1 scan quest (find a plant/bird/bug), 1 walk quest (targetKm 0.5 to 2.5), 1 observe quest (mindful observation).
Output valid JSON ONLY with this exact format:
{"quests":[{"emoji":"🌳","title":"Title (max 3 words)","description":"Actionable text","kind":"scan|walk|observe","targetKm":1.0,"minutes":20,"xp":50}]}
Keep XP between 30 and 80.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json'
    })
  });
  clearTimeout(timer);

  if (!res.ok) throw new Error('Ollama HTTP ' + res.status);
  const data = await res.json();
  const parsed = JSON.parse(data?.message?.content);
  return formatParsedQuests(parsed);
}

async function generateQuestsFromGoogleApi({ interests, minutes, locationName }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({ operation: 'quests', interests, minutes, locationName })
  });
  clearTimeout(timer);

  if (!res.ok) throw new Error('Managed quest API HTTP ' + res.status);
  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Managed quest API returned no content');
  const normalized = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = normalized.indexOf('{');
  const end = normalized.lastIndexOf('}');
  const parsed = JSON.parse(start >= 0 && end > start ? normalized.slice(start, end + 1) : normalized);
  return formatParsedQuests(parsed);
}

function formatParsedQuests(parsed) {
  if (Array.isArray(parsed?.quests) && parsed.quests.length >= 3) {
    const dateKey = getLocalDateKey();
    return parsed.quests.slice(0, 3).map((q, idx) => ({
      emoji: q.emoji || '🌳',
      title: q.title || 'Side Quest',
      description: q.description || 'Go explore outdoors.',
      kind: ['scan', 'walk', 'observe'].includes(q.kind) ? q.kind : 'observe',
      targetKm: q.kind === 'walk' ? Number(q.targetKm || 1.0) : undefined,
      minutes: Number(q.minutes || 20),
      xp: Number(q.xp || 40),
      id: `quest_ai_${dateKey}_${idx}`,
      status: 'todo',
      dateKey
    }));
  }
  throw new Error('Invalid format from AI response');
}
