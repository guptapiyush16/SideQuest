// XP + Levels — intentionally simple. The real world is the RPG.

export const XP = {
  NEW_DISCOVERY: 50,
  DUPLICATE: 5,
  DAILY_CHALLENGE: 50, // complete all 3 of today's quests
  PER_KM: 20,
};

const TITLES = [
  'Wanderer', 'Wanderer', 'Scout', 'Scout', 'Explorer', 'Explorer', 'Explorer',
  'Pathfinder', 'Pathfinder', 'Naturalist', 'Naturalist', 'Ranger', 'Ranger',
  'Trailblazer', 'Trailblazer', 'Field Legend',
];

/** XP needed to go from `level` to `level + 1`. */
export const xpForLevel = (level) => 100 + level * 100;

/** Turn total XP into { level, current, needed, progress, title }. */
export function levelFromXp(totalXp = 0) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  const needed = xpForLevel(level);
  return {
    level,
    current: remaining,
    needed,
    progress: needed ? remaining / needed : 0,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
  };
}
