function getOpenRouterKey() {
  return process.env.OPEN_ROUTER_APIKEY || process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
}

function getGeminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || process.env.GOOGLE_API_KEY;
}

const MODEL = (process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash').replace(/\\/g, '/');
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

const VISION_PROMPT = `Identify the primary visible subject in this photo. It may be an animal (including dog, cat, mammal, reptile), plant, flower, bird, insect, mushroom, or rock.
Do not guess a bird or plant when the image shows a mammal or pet. If the image is a screenshot, blank, person, or non-natural manufactured item, set subject_found to false.
Output JSON ONLY with this format:
{"subject_found":true,"candidates":[{"common_name":"Species Name","scientific_name":"Scientific name","category":"animal|plant|flower|bird|insect|mushroom|rock","confidence":95}],"region":"Native region or habitat","fun_fact":"One interesting sentence about this find."}`;

const QUEST_PROMPT = ({ interests, minutes, locationName }) => `You are the Quest Master for the outdoor exploration game "WildDex".
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

async function callGeminiDirect({ promptText, imageBase64, mimeType }) {
  const geminiKey = getGeminiKey();
  if (!geminiKey) throw new Error('GEMINI_API_KEY not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(geminiKey)}`;
  const parts = [{ text: promptText }];
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: mimeType || 'image/jpeg',
        data: imageBase64
      }
    });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  clearTimeout(timer);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Gemini HTTP ${response.status}: ${text.slice(0, 180)}`);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Google Gemini returned no content');
  let normalized = typeof text === 'string'
    ? text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    : text;
  if (typeof normalized === 'string') {
    const start = normalized.indexOf('{');
    const end = normalized.lastIndexOf('}');
    if (start >= 0 && end > start) normalized = normalized.slice(start, end + 1);
    return JSON.parse(normalized);
  }
  return normalized;
}

async function callOpenRouter(messages) {
  const key = getOpenRouterKey();
  if (!key) throw new Error('OpenRouter API key is not configured');
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://wilddex.onrender.com',
        'X-OpenRouter-Title': 'WildDex'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 600,
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
  let normalized = typeof text === 'string'
    ? text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    : text;
  if (typeof normalized === 'string') {
    const start = normalized.indexOf('{');
    const end = normalized.lastIndexOf('}');
    if (start >= 0 && end > start) normalized = normalized.slice(start, end + 1);
    return JSON.parse(normalized);
  }
  return normalized;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const hasGemini = Boolean(getGeminiKey());
    const hasOpenRouter = Boolean(getOpenRouterKey());

    if (body.operation === 'health') {
      if (!hasGemini && !hasOpenRouter) {
        return json(res, 503, { error: 'No AI service configured (set GEMINI_API_KEY or OPEN_ROUTER_APIKEY)' });
      }
      return json(res, 200, {
        ok: true,
        directGemini: hasGemini,
        openRouterFallback: hasOpenRouter,
        model: hasGemini ? GEMINI_MODEL : MODEL
      });
    }

    if (body.operation === 'vision') {
      if (typeof body.imageBase64 !== 'string' || body.imageBase64.length < 100 || body.imageBase64.length > 12_000_000) {
        return json(res, 400, { error: 'Invalid image payload' });
      }

      // 1. Try free Direct Google Gemini if key is provided
      if (hasGemini) {
        try {
          const direct = await callGeminiDirect({
            promptText: VISION_PROMPT,
            imageBase64: body.imageBase64,
            mimeType: body.mimeType
          });
          if (direct && direct.candidates) {
            return json(res, 200, direct);
          }
        } catch (err) {
          console.warn('Direct Google Gemini failed (quota/busy), trying OpenRouter:', err.message);
        }
      }

      // 2. OpenRouter vision
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
      const prompt = QUEST_PROMPT({ interests, minutes, locationName });

      // 1. Try free Direct Google Gemini if key is provided
      if (hasGemini) {
        try {
          const direct = await callGeminiDirect({ promptText: prompt });
          if (direct && direct.quests) {
            return json(res, 200, direct);
          }
        } catch (err) {
          console.warn('Direct Google Gemini failed for quests, trying OpenRouter:', err.message);
        }
      }

      // 2. OpenRouter quests
      const data = await callOpenRouter([{
        role: 'user',
        content: prompt
      }]);
      return json(res, 200, modelJson(data));
    }

    return json(res, 400, { error: 'Unknown operation' });
  } catch (error) {
    console.error('AI proxy error:', error);
    return json(res, 502, { error: error.message || 'AI service request failed' });
  }
};
