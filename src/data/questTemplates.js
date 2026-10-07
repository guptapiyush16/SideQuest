// ~10 quest templates. Used as the offline fallback AND as style examples
// for the Quest Master LLM so its output stays grounded and safe.
//
// kind:
//   'walk'    → tracked with GPS, completes at targetKm
//   'scan'    → completes when you add a discovery (new or duplicate) during the quest
//   'observe' → self-reported, the user taps "I did it"

export const QUEST_TEMPLATES = [
  {
    emoji: '🌳', title: 'Nature Scout', kind: 'scan', minutes: 20, xp: 50, tags: ['plants', 'nature'],
    description: "Find and photograph a plant you don't recognize.",
  },
  {
    emoji: '🚶', title: 'Explorer', kind: 'walk', targetKm: 1, minutes: 15, xp: 30, tags: ['walking', 'fitness'],
    description: 'Walk 1 km outside.',
  },
  {
    emoji: '👀', title: 'Observer', kind: 'observe', minutes: 10, xp: 40, tags: ['mindfulness', 'curiosity'],
    description: "Find something interesting you've never noticed before.",
  },
  {
    emoji: '🐦', title: 'Bird Spotter', kind: 'scan', minutes: 25, xp: 60, tags: ['birds', 'nature'],
    description: 'Spot and scan any bird. Patience is the whole trick.',
  },
  {
    emoji: '🌸', title: 'Color Hunter', kind: 'scan', minutes: 20, xp: 50, tags: ['flowers', 'photography'],
    description: 'Find a flower in a colour you haven’t collected yet.',
  },
  {
    emoji: '🧭', title: 'New Street', kind: 'walk', targetKm: 1.5, minutes: 30, xp: 60, tags: ['walking', 'exploring'],
    description: 'Walk 1.5 km and take at least one turn you’ve never taken before.',
  },
  {
    emoji: '🦋', title: 'Tiny World', kind: 'scan', minutes: 20, xp: 70, tags: ['insects', 'macro'],
    description: 'Get close to the ground. Find and scan an insect.',
  },
  {
    emoji: '🎧', title: 'Sound Map', kind: 'observe', minutes: 10, xp: 40, tags: ['mindfulness'],
    description: 'Stand still for 3 minutes outdoors and count 5 different natural sounds.',
  },
  {
    emoji: '🪨', title: 'Texture Collector', kind: 'scan', minutes: 15, xp: 40, tags: ['rocks', 'geology'],
    description: 'Find an interesting rock or stone and scan it.',
  },
  {
    emoji: '🌅', title: 'Golden Hour', kind: 'observe', minutes: 20, xp: 50, tags: ['photography', 'sky'],
    description: 'Go somewhere with open sky and watch the light change for 10 minutes.',
  },
  {
    emoji: '🍃', title: 'Leaf Library', kind: 'scan', minutes: 30, xp: 80, tags: ['plants', 'trees'],
    description: 'Scan 1 tree whose leaves look different from every tree on your street.',
  },
  {
    emoji: '🏞️', title: 'Park Loop', kind: 'walk', targetKm: 2, minutes: 40, xp: 90, tags: ['walking', 'fitness', 'parks'],
    description: 'Find the nearest park and walk a 2 km loop through it.',
  },
];

export const INTEREST_OPTIONS = [
  '🌳 Trees', '🌸 Flowers', '🐦 Birds', '🦋 Insects', '🍄 Fungi', '🪨 Rocks',
  '🚶 Walking', '📷 Photography', '🧘 Mindfulness', '🏙️ Urban exploring',
];

export const TIME_OPTIONS = [15, 30, 60];

/** Pick 3 varied fallback quests that fit the available time. */
export function pickFallbackQuests({ interests = [], minutes = 30, previous = [] } = {}) {
  const lower = interests.map((i) => i.toLowerCase());
  const recent = new Set(previous.slice(-6));
  const fits = QUEST_TEMPLATES.filter((q) => q.minutes <= Math.max(minutes, 15));
  const score = (q) => {
    let s = Math.random();
    if (q.tags.some((t) => lower.some((i) => i.includes(t.slice(0, 4))))) s += 1.5;
    if (recent.has(q.title)) s -= 2;
    return s;
  };
  const sorted = [...fits].sort((a, b) => score(b) - score(a));

  // Ensure variety: try to include one of each kind.
  const out = [];
  for (const kind of ['scan', 'walk', 'observe']) {
    const q = sorted.find((x) => x.kind === kind && !out.includes(x));
    if (q) out.push(q);
  }
  for (const q of sorted) if (out.length < 3 && !out.includes(q)) out.push(q);
  return out.slice(0, 3);
}
