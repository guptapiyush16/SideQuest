// 🧠 AI #1 — Quest Master
// User context → open-weight LLM (Ollama) → 3 safe, personalised outdoor quests.
import { ollamaJson } from './ollama';
import { memoryToPrompt } from './adventureMemory';
import { QUEST_TEMPLATES, pickFallbackQuests } from '../data/questTemplates';

const SYSTEM = `You are the Quest Master for "SideQuest IRL", an app whose goal is to get people OFF their phones and outside.
You design short real-world side quests. Rules:
- Exactly 3 quests, each achievable in 10-60 minutes, within the user's available time.
- SAFE and legal: public spaces only, daylight-friendly, no trespassing, no climbing, no entering water, no touching wild animals or unknown mushrooms, no busy roads, no interacting with strangers.
- Varied: ideally one "scan" quest (photograph & identify a living thing / rock), one "walk" quest (distance), one "observe" quest (mindful noticing).
- Personalise using the user's interests, location and history. Never repeat recent quests verbatim.
- Short, playful, concrete. Title max 3 words. Description max 20 words.
Respond ONLY with JSON: {"quests":[{"emoji":"🌳","title":"...","description":"...","kind":"scan|walk|observe","targetKm":1.0,"minutes":20,"xp":50}]}
targetKm only for walk quests (0.5-3). xp between 30 and 100, scaled with effort.`;

const UNSAFE = /(trespass|climb|swim|river|lake|pond edge|night|midnight|stranger|highway|rooftop|fence|touch the (snake|dog|monkey)|eat|taste|pick (a )?mushroom)/i;

function sanitize(q) {
  const kind = ['scan', 'walk', 'observe'].includes(q.kind) ? q.kind : 'observe';
  const clamp = (n, lo, hi, d) => (Number.isFinite(+n) ? Math.min(hi, Math.max(lo, +n)) : d);
  return {
    emoji: typeof q.emoji === 'string' && q.emoji.length <= 4 ? q.emoji : kind === 'walk' ? '🚶' : kind === 'scan' ? '🔍' : '👀',
    title: String(q.title || 'Side Quest').slice(0, 28),
    description: String(q.description || '').slice(0, 140),
    kind,
    targetKm: kind === 'walk' ? Math.round(clamp(q.targetKm, 0.5, 3, 1) * 10) / 10 : undefined,
    minutes: Math.round(clamp(q.minutes, 10, 60, 20)),
    xp: Math.round(clamp(q.xp, 30, 100, 50) / 5) * 5,
  };
}

const withIds = (quests, source) =>
  quests.map((q, i) => ({
    ...q,
    id: `${Date.now()}-${i}`,
    status: 'todo', // todo | active | done
    source, // 'ai' | 'offline'
  }));

/**
 * @returns {Promise<{quests: object[], source: 'ai'|'offline', error?: string}>}
 */
export async function generateDailyQuests({ settings, memory, place, minutes }) {
  const fallback = () =>
    withIds(
      pickFallbackQuests({ interests: memory.interests, minutes, previous: memory.recentQuests.map((r) => r.split(' (')[0]) }),
      'offline'
    );

  if (!settings.aiEnabled) return { quests: fallback(), source: 'offline' };

  const examples = QUEST_TEMPLATES.slice(0, 4)
    .map((t) => `- ${t.emoji} ${t.title} [${t.kind}${t.targetKm ? `, ${t.targetKm} km` : ''}] ${t.description} (+${t.xp} XP)`)
    .join('\n');

  const prompt = `USER CONTEXT
Approximate location: ${place || 'unknown city'}
Local time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Available time: ${minutes} minutes
${memoryToPrompt(memory)}

STYLE EXAMPLES
${examples}

Generate today's 3 SideQuests as JSON.`;

  try {
    const data = await ollamaJson({
      url: settings.ollamaUrl,
      model: settings.textModel,
      system: SYSTEM,
      prompt,
      temperature: 0.9,
      timeoutMs: 60000,
    });
    const raw = Array.isArray(data?.quests) ? data.quests : [];
    const quests = raw
      .map(sanitize)
      .filter((q) => q.description && !UNSAFE.test(`${q.title} ${q.description}`))
      .filter((q) => q.minutes <= Math.max(minutes, 15) + 15);
    if (quests.length < 3) {
      // Top up with templates rather than failing.
      const extra = fallback().filter((f) => !quests.some((q) => q.title === f.title));
      quests.push(...extra.slice(0, 3 - quests.length));
    }
    return { quests: withIds(quests.slice(0, 3), 'ai'), source: 'ai' };
  } catch (e) {
    return { quests: fallback(), source: 'offline', error: e.message };
  }
}
