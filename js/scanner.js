// 👁️ AI #2 — Field Guide Scanner
// Analyzes photos, detects biological subjects, and outputs confidence ratings
// Never presents uncertain identification as fact.

import { FIELD_GUIDE, findFieldGuideMatch, categoryMeta, normalizeCategory, speciesKey } from './fieldGuide.js';

export class ScannerEngine {
  constructor() {
    this.videoStream = null;
  }

  async startCamera(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API is not supported in this browser environment.');
    }
    this.stopCamera();

    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.videoStream;
      await videoElement.play();
      return true;
    } catch (err) {
      console.warn('Could not start rear environment camera:', err);
      // Fallback to any available video camera
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoElement.srcObject = this.videoStream;
      await videoElement.play();
      return true;
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }
  }

  captureSnapshot(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  async analyzePhoto(dataUrl, { aiSettings = {}, preferredCategory = null } = {}) {
    const mode = 'google-api';
    let visionError = null;

    // 1. Managed vision API
    if (mode === 'google-api') {
      try {
        const visionResult = await this.callGoogleVision(dataUrl);
        if (visionResult) return visionResult;
      } catch (err) {
        visionError = err;
        console.warn('Google vision API failed, falling back to local Field Guide classifier:', err.message);
      }
    }

    return {
      status: 'unsupported',
      candidates: [],
      topCandidate: null,
      otherPercentage: 100,
      source: 'google-api',
      message: visionError?.message?.includes('503')
        ? 'Managed Google AI is temporarily busy. Please try again in a moment.'
        : 'Managed Google AI could not analyze this image. Please try another photo.'
    };
  }

  async callGoogleVision(dataUrl) {
    const base64Data = dataUrl.split(',')[1];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        operation: 'vision',
        imageBase64: base64Data,
        mimeType: dataUrl.match(/^data:([^;]+);/)?.[1] || 'image/jpeg'
      })
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || ('Managed vision API HTTP ' + res.status));
    }

    const data = await res.json();
    let parsed = null;

    if (data && typeof data === 'object') {
      if (Array.isArray(data.candidates) || data.subject_found !== undefined) {
        // Direct parsed object from /api/ai
        parsed = data;
      } else if (data?.choices?.[0]?.message?.content) {
        // Raw OpenAI/OpenRouter chat format
        const rawText = data.choices[0].message.content;
        const normalized = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        parsed = JSON.parse(normalized);
      }
    } else if (typeof data === 'string') {
      const normalized = data.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(normalized);
    }

    if (!parsed) throw new Error('Managed vision API returned invalid data format');
    return this.formatVisionResult(parsed);
  }

  async callOllamaVision(dataUrl, ollamaUrl, model = 'paligemma') {
    const base64Data = dataUrl.split(',')[1];
    const prompt = `Identify the primary natural species or object (plant, flower, bird, insect, mushroom, or rock) in this photo.
Return JSON ONLY:
{
  "subject_found": true,
  "candidates": [
    {"common_name": "Indian Banyan", "scientific_name": "Ficus benghalensis", "category": "plant", "confidence": 91}
  ],
  "region": "Native to India",
  "fun_fact": "One fascinating sentence."
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: prompt,
          images: [base64Data]
        }],
        stream: false,
        format: 'json'
      })
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error('Ollama vision returned HTTP ' + res.status);
    const data = await res.json();
    const parsed = JSON.parse(data?.message?.content);
    return this.formatVisionResult(parsed);
  }

  formatVisionResult(parsed) {
    if (!parsed) return null;
    let candidatesList = parsed.candidates;
    if (!Array.isArray(candidatesList) && (parsed.common_name || parsed.species)) {
      candidatesList = [{
        common_name: parsed.common_name || parsed.species,
        scientific_name: parsed.scientific_name || parsed.scientific || '',
        category: parsed.category || 'animal',
        confidence: parsed.confidence || 90
      }];
    }

    if (Array.isArray(candidatesList) && candidatesList.length > 0) {
      const candidates = candidatesList.map(c => {
        const itemMatch = findFieldGuideMatch(c.common_name, c.scientific_name);
        return {
          id: itemMatch ? itemMatch.id : speciesKey(c.common_name, c.scientific_name),
          name: c.common_name,
          scientific: c.scientific_name,
          category: normalizeCategory(c.category || itemMatch?.category, c.common_name, c.scientific_name),
          confidence: Math.min(99, Math.max(10, Math.round(c.confidence || 75))),
          rarity: itemMatch ? itemMatch.rarity : 2,
          region: parsed.region || itemMatch?.region || 'Widespread',
          fact: parsed.fun_fact || itemMatch?.fact || ''
        };
      });

      const isConfident = candidates[0].confidence >= 80;
      return {
        status: isConfident ? 'identified' : 'possible',
        candidates,
        topCandidate: candidates[0],
        otherPercentage: Math.max(0, 100 - candidates.reduce((s, c) => s + c.confidence, 0)),
        source: 'ai_vision'
      };
    }

    if (parsed && (parsed.subject_found === false || parsed.reason === 'screen_detected')) {
      const isScreen = parsed.reason === 'screen_detected';
      return {
        status: isScreen ? 'screen_detected' : 'not_found',
        candidates: [],
        topCandidate: null,
        otherPercentage: 100,
        source: 'ai_vision',
        message: isScreen
          ? 'Screen detected! WildDex is an authentic IRL field guide. Please step outside and photograph real physical animals, plants, or nature, not a digital screen.'
          : 'No animal, plant, bird, insect, or mineral was clearly detected in this photo. Make sure the subject is centered and well-lit.'
      };
    }

    return null;
  }

  classifyLocalFieldGuide(dataUrl, preferredCategory) {
    return {
      status: 'unsupported',
      candidates: [],
      topCandidate: null,
      otherPercentage: 100,
      source: 'field_guide',
      message: 'Offline mode cannot identify the contents of a photo. Choose Managed Google AI or Ollama for image recognition.'
    };
  }
}
