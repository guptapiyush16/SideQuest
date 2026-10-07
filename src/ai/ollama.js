// Minimal Ollama client (local open-weight models).
// Docs: https://github.com/ollama/ollama/blob/main/docs/api.md
import Constants from 'expo-constants';

export const DEFAULT_TEXT_MODEL = 'llama3.2';
export const DEFAULT_VISION_MODEL = 'qwen2.5vl';

/**
 * When running in Expo Go, the dev machine's LAN IP is in hostUri
 * (e.g. "192.168.1.20:8081"). Ollama on that same machine is the best default.
 */
export function guessOllamaUrl() {
  const host =
    Constants?.expoConfig?.hostUri ||
    Constants?.expoGoConfig?.debuggerHost ||
    Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
    '';
  const ip = host.split(':')[0];
  return ip ? `http://${ip}:11434` : 'http://localhost:11434';
}

async function withTimeout(promise, ms, controller) {
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await promise;
  } finally {
    clearTimeout(t);
  }
}

/** Calls /api/chat and returns parsed JSON from the model. Throws on failure. */
export async function ollamaJson({ url, model, system, prompt, images, temperature = 0.7, timeoutMs = 60000 }) {
  const controller = new AbortController();
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt, ...(images ? { images } : {}) });

  const res = await withTimeout(
    fetch(`${url.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format: 'json',
        options: { temperature },
      }),
    }),
    timeoutMs,
    controller
  );
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return parseJsonLoose(data?.message?.content);
}

/** Lists installed models — used for the "Test connection" button. */
export async function ollamaTags(url) {
  const controller = new AbortController();
  const res = await withTimeout(fetch(`${url.replace(/\/$/, '')}/api/tags`, { signal: controller.signal }), 5000, controller);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.models || []).map((m) => m.name);
}

function parseJsonLoose(text) {
  if (!text) throw new Error('Empty model response');
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Model did not return JSON');
  }
}
