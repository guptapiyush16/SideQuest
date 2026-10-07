// 🎒 AI #3 — Adventure Memory
// Condenses past quests, discoveries and interests into a compact context
// the Quest Master can use to personalise tomorrow's quests.
import { FIELD_GUIDE, FIELD_GUIDE_SIZE } from '../data/fieldGuide';
import { categoryMeta } from '../theme';

export function buildAdventureMemory({ pokedex = {}, questLog = [], history = {}, interests = [] }) {
  const entries = Object.values(pokedex);

  const byCategory = {};
  for (const e of entries) byCategory[e.category] = (byCategory[e.category] || 0) + 1;

  // Categories the user has barely explored → nudge them there.
  const underExplored = Object.keys(categoryMeta)
    .filter((c) => c !== 'other' && (byCategory[c] || 0) < 2)
    .map((c) => categoryMeta[c].label.toLowerCase());

  // A few uncollected Field Guide targets to hint at.
  const caught = new Set(Object.keys(pokedex));
  const targets = FIELD_GUIDE.filter((s) => !caught.has(s.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
    .map((s) => s.name);

  const recentQuests = questLog.slice(-8).map((q) => `${q.title} (${q.completed ? 'done' : 'skipped'})`);
  const days = Object.values(history);
  const totalKm = days.reduce((s, d) => s + (d.distanceKm || 0), 0);
  const recentDiscoveries = entries
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 5)
    .map((e) => e.name);

  return {
    interests,
    discoveredCount: entries.length,
    fieldGuideSize: FIELD_GUIDE_SIZE,
    byCategory,
    underExplored,
    uncollectedTargets: targets,
    recentQuests,
    recentDiscoveries,
    totalKm: Math.round(totalKm * 10) / 10,
    activeDays: days.length,
  };
}

/** Human-readable summary for the prompt. */
export function memoryToPrompt(m) {
  return [
    `Interests: ${m.interests.join(', ') || 'not set'}`,
    `Discovered ${m.discoveredCount} things so far (${Object.entries(m.byCategory).map(([k, v]) => `${v} ${k}`).join(', ') || 'none yet'}).`,
    `Recently discovered: ${m.recentDiscoveries.join(', ') || 'nothing yet'}.`,
    `Under-explored categories: ${m.underExplored.join(', ') || 'none'}.`,
    `Uncollected things they could look for: ${m.uncollectedTargets.join(', ')}.`,
    `Recent quests (avoid repeating): ${m.recentQuests.join('; ') || 'none'}.`,
    `Lifetime: ${m.totalKm} km walked over ${m.activeDays} active days.`,
  ].join('\n');
}
