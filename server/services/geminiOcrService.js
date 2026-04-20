import axios from 'axios';
import { safeJsonParse } from '../utils/safeJsonParse.js';

const PROMPT = `You are a medical data extraction system. Extract all medicines from this prescription image and return strictly in JSON format.

Each medicine should have:
- name
- dosage (e.g., 500mg)
- frequency (e.g., twice a day)
- duration (e.g., 5 days)
- instructions (optional)

Return format:
{
  "medicines": [
    {
      "name": "",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "instructions": ""
    }
  ]
}

Do not return anything except valid JSON.`;

const normalizeMedicinesPayload = (payload) => {
  if (!Array.isArray(payload?.medicines)) {
    return { medicines: [] };
  }

  const medicines = payload.medicines
    .map((item) => ({
      name: String(item?.name || '').trim(),
      dosage: String(item?.dosage || '').trim(),
      frequency: String(item?.frequency || '').trim(),
      duration: String(item?.duration || '').trim(),
      instructions: String(item?.instructions || '').trim(),
    }))
    .filter((item) => item.name && item.dosage && item.frequency);

  return { medicines };
};

const normalizeStringList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 12);
};

const normalizeMedicineInsightsPayload = (payload, fallbackName = '') => {
  const safetyLevel = String(payload?.safety_level || '').toLowerCase();

  return {
    name: String(payload?.name || fallbackName).trim(),
    uses: normalizeStringList(payload?.uses),
    common_side_effects: normalizeStringList(payload?.common_side_effects),
    serious_side_effects: normalizeStringList(payload?.serious_side_effects),
    interactions: normalizeStringList(payload?.interactions),
    contraindications: normalizeStringList(payload?.contraindications),
    food_and_alcohol_notes: normalizeStringList(payload?.food_and_alcohol_notes),
    missed_dose_advice: String(payload?.missed_dose_advice || '').trim(),
    overdose_advice: String(payload?.overdose_advice || '').trim(),
    storage_guidance: String(payload?.storage_guidance || '').trim(),
    warnings: normalizeStringList(payload?.warnings),
    monitoring_tips: normalizeStringList(payload?.monitoring_tips),
    safety_level: ['low', 'moderate', 'high'].includes(safetyLevel) ? safetyLevel : 'moderate',
    disclaimer:
      String(payload?.disclaimer || '').trim() ||
      'This information is educational and not a substitute for professional medical advice.',
  };
};

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
];

const buildEndpoint = (model, apiKey) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const isUnsupportedModelError = (error) => {
  const message = error?.response?.data?.error?.message || error?.message || '';
  return /not found for API version v1beta|not be supported for generateContent|model not found|unsupported/i.test(message);
};

const callGeminiModel = async ({ model, apiKey, requestBody }) => {
  const endpoint = buildEndpoint(model, apiKey);
  return axios.post(endpoint, requestBody, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 45000,
  });
};

export const extractMedicinesWithGemini = async ({ base64Image, mimeType }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in environment variables.');
  }

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelsToTry = [configuredModel, ...FALLBACK_MODELS.filter((model) => model !== configuredModel)];

  const requestBody = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  let lastError = null;
  let response = null;

  for (const model of modelsToTry) {
    try {
      response = await callGeminiModel({ model, apiKey, requestBody });
      break;
    } catch (error) {
      lastError = error;
      if (!isUnsupportedModelError(error)) {
        throw error;
      }
    }
  }

  if (!response) {
    throw lastError || new Error('No supported Gemini model could be reached.');
  }

  const text = response?.data?.candidates?.[0]?.content?.parts?.find((part) => typeof part?.text === 'string')?.text;
  if (!text) {
    throw new Error('Gemini OCR returned no text output.');
  }

  const parsed = safeJsonParse(text);
  return normalizeMedicinesPayload(parsed);
};

export const extractMedicineInsightsWithGemini = async ({ name, dosage = '', frequency = '' }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in environment variables.');
  }

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelsToTry = [configuredModel, ...FALLBACK_MODELS.filter((model) => model !== configuredModel)];

  const prompt = `You are a medicine information assistant. Return STRICT JSON only.

Input medicine:
- name: ${name}
- dosage: ${dosage || 'unknown'}
- frequency: ${frequency || 'unknown'}

Return schema:
{
  "name": "",
  "uses": [""],
  "common_side_effects": [""],
  "serious_side_effects": [""],
  "interactions": [""],
  "contraindications": [""],
  "food_and_alcohol_notes": [""],
  "missed_dose_advice": "",
  "overdose_advice": "",
  "storage_guidance": "",
  "warnings": [""],
  "monitoring_tips": [""],
  "safety_level": "low|moderate|high",
  "disclaimer": ""
}

Rules:
- Keep advice practical, concise, and patient-safe.
- Mention emergency escalation for severe side effects.
- If uncertain, use cautious language.
- Return only valid JSON, no markdown.`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  let lastError = null;
  let response = null;

  for (const model of modelsToTry) {
    try {
      response = await callGeminiModel({ model, apiKey, requestBody });
      break;
    } catch (error) {
      lastError = error;
      if (!isUnsupportedModelError(error)) {
        throw error;
      }
    }
  }

  if (!response) {
    throw lastError || new Error('No supported Gemini model could be reached.');
  }

  const text = response?.data?.candidates?.[0]?.content?.parts?.find((part) => typeof part?.text === 'string')?.text;
  if (!text) {
    throw new Error('Gemini medicine insights returned no text output.');
  }

  const parsed = safeJsonParse(text);
  return normalizeMedicineInsightsPayload(parsed, name);
};
