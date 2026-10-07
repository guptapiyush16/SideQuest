const MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

async function callOpenRouter(messages) {
  const key = process.env.OPEN_ROUTER_APIKEY || process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('AI service is not configured');
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sidequest-0kzp.onrender.com',
        'X-OpenRouter-Title': 'SideQuest IRL'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1
      })
    });
    const text = await response.text();
    if (response.ok) return JSON.parse(text);

    lastError = new Error(`OpenRouter HTTP ${response.status}: ${text.slice(0, 200)}`);
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) break;
    await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
  }

  throw lastError;
}

function modelJson(data) {
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('AI returned no content');
  const normalized = typeof text === 'string'
    ? text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    : text;
  return typeof normalized === 'string' ? JSON.parse(normalized) : normalized;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (body.operation === 'health') {
      if (!process.env.OPEN_ROUTER_APIKEY && !process.env.OPENROUTER_API_KEY) {
        return json(res, 503, { error: 'OpenRouter AI service is not configured' });
      }
      return json(res, 200, { ok: true, provider: 'openrouter', model: MODEL });
    }

    if (body.operation === 'vision') {
      if (typeof body.imageBase64 !== 'string' || body.imageBase64.length < 100 || body.imageBase64.length > 12_000_000) {
        return json(res, 400, { error: 'Invalid image payload' });
      }
      const data = await callOpenRouter([{
        role: 'user',
        content: [
          { type: 'text', text: VISION_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${body.mimeType || 'image/jpeg'};base64,${body.imageBase64}`
            }
          }
        ]
      }]);
      return json(res, 200, modelJson(data));
    }

    if (body.operation === 'quests') {
      const interests = Array.isArray(body.interests) ? body.interests.slice(0, 10).map(String) : [];
      const minutes = Math.min(60, Math.max(10, Number(body.minutes) || 30));
      const locationName = typeof body.locationName === 'string' ? body.locationName.slice(0, 80) : '';
      const data = await callOpenRouter([{
        role: 'user',
        content: QUEST_PROMPT({ interests, minutes, locationName })
      }]);
      return json(res, 200, modelJson(data));
    }

    return json(res, 400, { error: 'Unknown operation' });
  } catch (error) {
    console.error('AI proxy error:', error);
    return json(res, 502, { error: error.message || 'AI service request failed' });
  }
}
