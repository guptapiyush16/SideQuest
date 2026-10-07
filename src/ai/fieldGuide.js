// 👁️ AI #2 — Field Guide
// Camera image → vision model (Ollama) → species/object identification + confidence.
// Never presents an uncertain identification as fact.
import { ollamaJson } from './ollama';
import { FIELD_GUIDE, matchFieldGuide } from '../data/fieldGuide';

export const CONFIDENT_THRESHOLD = 80; // top match must be ≥ this…
export const MIN_MARGIN = 25; // …and this far ahead of #2

const CATEGORIES = ['plant', 'flower', 'bird', 'insect', 'mushroom', 'rock', 'animal', 'other'];

const SYSTEM = `You are a careful field naturalist inside a nature-collection app.
Identify the main living thing or natural object in the photo (plant, tree, flower, bird, insect, mushroom/fungus/lichen, rock/mineral, small animal).
Be honest about uncertainty. If the photo is blurry, too far, or ambiguous, give LOWER confidence and several candidates.
If there's no natural subject (e.g. a person, screen, indoor object), return an empty candidates list.
Respond ONLY with JSON:
{"subject_found":true,"category":"plant|flower|bird|insect|mushroom|rock|animal|other",
 "candidates":[{"common_name":"Indian Banyan","scientific_name":"Ficus benghalensis","confidence":91}],
 "native_region":"Native to India","fun_fact":"One short sentence."}
Give 1-3 candidates, most likely first. confidence is 0-100 and all candidates together must not exceed 100.`;

function normaliseCandidates(list = [], fallbackCategory) {
  let cands = list
    .filter((c) => c && (c.common_name || c.name))
    .slice(0, 3)
    .map((c) => {
      const name = String(c.common_name || c.name).trim();
      const scientific = String(c.scientific_name || c.scientific || '').trim();
      const guide = matchFieldGuide(name, scientific);
      return {
        name: guide?.name || name,
        scientific: guide?.scientific || scientific,
        category: guide?.category || (CATEGORIES.includes(c.category) ? c.category : fallbackCategory || 'other'),
        rarity: guide?.rarity || 2,
        inFieldGuide: !!guide,
        confidence: Math.max(0, Math.min(100, Math.round(+c.confidence || 0))),
      };
    });
  const total = cands.reduce((s, c) => s + c.confidence, 0);
  if (total > 100) cands = cands.map((c) => ({ ...c, confidence: Math.round((c.confidence / total) * 100) }));
  return cands.sort((a, b) => b.confidence - a.confidence);
}

function classify(cands) {
  if (!cands.length) return 'unknown';
  const [a, b] = cands;
  const margin = a.confidence - (b?.confidence || 0);
  return a.confidence >= CONFIDENT_THRESHOLD && margin >= MIN_MARGIN ? 'identified' : 'possible';
}

/**
 * @param {{ base64: string, settings: object }} args
 * @returns {Promise<{status:'identified'|'possible'|'unknown', candidates:object[], other:number,
 *   region?:string, fact?:string, source:'ai'|'demo', error?:string}>}
 */
export async function identifyPhoto({ base64, settings }) {
  if (settings.aiEnabled && base64) {
    try {
      const data = await ollamaJson({
        url: settings.ollamaUrl,
        model: settings.visionModel,
        system: SYSTEM,
        prompt: 'Identify the main natural subject in this photo. JSON only.',
        images: [base64],
        temperature: 0.2,
        timeoutMs: 120000,
      });
      const cands = data?.subject_found === false ? [] : normaliseCandidates(data?.candidates, data?.category);
      const status = classify(cands);
      const top = cands[0];
      const guide = top && matchFieldGuide(top.name, top.scientific);
      return {
        status,
        candidates: cands,
        other: Math.max(0, 100 - cands.reduce((s, c) => s + c.confidence, 0)),
        region: guide?.region || data?.native_region || '',
        fact: data?.fun_fact || '',
        source: 'ai',
      };
    } catch (e) {
      return { ...demoIdentify(), error: e.message };
    }
  }
  return demoIdentify();
}

/** Offline demo: clearly labelled as DEMO in the UI, never as a real ID. */
function demoIdentify() {
  const pick = () => FIELD_GUIDE[Math.floor(Math.random() * FIELD_GUIDE.length)];
  const a = pick();
  const confident = Math.random() < 0.65;
  let candidates;
  if (confident) {
    const conf = 82 + Math.floor(Math.random() * 15);
    candidates = [{ ...a, inFieldGuide: true, confidence: conf }];
  } else {
    const sameCat = FIELD_GUIDE.filter((s) => s.category === a.category && s.id !== a.id);
    const b = sameCat[Math.floor(Math.random() * sameCat.length)] || pick();
    const c1 = 55 + Math.floor(Math.random() * 20);
    const c2 = Math.min(100 - c1 - 5, 10 + Math.floor(Math.random() * 15));
    candidates = [
      { ...a, inFieldGuide: true, confidence: c1 },
      { ...b, inFieldGuide: true, confidence: c2 },
    ];
  }
  return {
    status: classify(candidates),
    candidates,
    other: Math.max(0, 100 - candidates.reduce((s, c) => s + c.confidence, 0)),
    region: a.region,
    fact: '',
    source: 'demo',
  };
}
