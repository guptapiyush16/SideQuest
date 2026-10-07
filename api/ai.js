const MODEL = process.env.GOOGLE_GENERATIVE_AI_MODEL || 'gemini-2.0-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const VISION_PROMPT = `Identify the primary natural species or object (plant, flower, bird, insect, mushroom, or rock) in this photo.
Output JSON ONLY with this format:
{"subject_found":true,"candidates":[{"common_name":"Species Name","scientific_name":"Scientific name","category":"plant|flower|bird|insect|mushroom|rock","confidence":91}],"region":"Native region or habitat","fun_fact":"One interesting sentence about this find."}`;

const QUEST_PROMPT = ({ interests, minutes, locationName }) => `You are the Quest Master for the outdoor exploration game "SideQuest IRL".
Generate exactly 3 safe, fun outdoor quests for an explorer in ${locationName || 'their local city'}.
Available time: ${minutes} minutes.
Interests: ${interests.join(', ') || 'general nature, walking'}.
Rules: exactly 1 scan quest, 1 walk quest with targetKm 0.5 to 2.5, and 1 observe quest. Public spaces only; no trespassing, climbing, water, roads, strangers, touching wildlife, or eating anything.
Output valid JSON ONLY:
{"quests":[{"emoji":"🌳","title":"Title (max 3 words)","description":"Actionable text","kind":"scan|walk|observe","targetKm":1.0,"minutes":20,"xp":50}]}
Keep XP between 30 and 80.`;

function json(res, status, body) {
  res.status(status).json(body);
}

async function callGoogle(payload) {
  const key = process.env.GOOGLE_GENERATIVE_AI_KEY;
  if (!key) throw new Error('AI service is not configured');
  const response = await fetch(`${API_BASE}/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Google AI HTTP ${response.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

function modelJson(data) {
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('AI returned no content');
  return JSON.parse(text);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (body.operation === 'health') {
      if (!process.env.GOOGLE_GENERATIVE_AI_KEY) return json(res, 503, { error: 'AI service is not configured' });
      return json(res, 200, { ok: true });
    }

    if (body.operation === 'vision') {
      if (typeof body.imageBase64 !== 'string' || body.imageBase64.length < 100 || body.imageBase64.length > 12_000_000) {
        return json(res, 400, { error: 'Invalid image payload' });
      }
      const data = await callGoogle({
        contents: [{ parts: [
          { text: VISION_PROMPT },
          { inline_data: { mime_type: body.mimeType || 'image/jpeg', data: body.imageBase64 } }
        ] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      return json(res, 200, modelJson(data));
    }

    if (body.operation === 'quests') {
      const interests = Array.isArray(body.interests) ? body.interests.slice(0, 10).map(String) : [];
      const minutes = Math.min(60, Math.max(10, Number(body.minutes) || 30));
      const locationName = typeof body.locationName === 'string' ? body.locationName.slice(0, 80) : '';
      const data = await callGoogle({
        contents: [{ parts: [{ text: QUEST_PROMPT({ interests, minutes, locationName }) }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      return json(res, 200, modelJson(data));
    }

    return json(res, 400, { error: 'Unknown operation' });
  } catch (error) {
    console.error('AI proxy error:', error);
    return json(res, 502, { error: error.message || 'AI service request failed' });
  }
}
